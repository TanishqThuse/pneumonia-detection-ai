from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.model import load_model, predict, TRANSFORM
from app.risk import assess_risk
import os, io, json, hashlib, time
from pathlib import Path
from datetime import datetime, timezone
from PIL import Image

app = FastAPI(title="PneumoAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("MODEL_PATH", "app/best_model.pth")
model = load_model(MODEL_PATH)
print("✅ Model loaded successfully")

# ── In-memory counters (live metrics) ─────────────────────────────────────
_stats = {"total": 0, "pneumonia": 0, "normal": 0,
          "agreed": 0, "disagreed": 0}

# ── Directories ────────────────────────────────────────────────────────────
Path("logs").mkdir(exist_ok=True)
Path("flagged_for_retraining").mkdir(exist_ok=True)


def _log(image_bytes: bytes, result: dict):
    entry = {
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "image_hash":   hashlib.sha256(image_bytes).hexdigest()[:12],
        "prediction":   result["prediction"],
        "confidence":   result["confidence"],
        "uncertainty":  result.get("uncertainty"),
        "severity":     result.get("severity", {}).get("level"),
        "total_ms":     result.get("timing", {}).get("total_ms"),
    }
    with open("logs/predictions.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\n")


# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "predictions_served": _stats["total"]}


# ── Main predict ───────────────────────────────────────────────────────────
@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large — max 10 MB")

    try:
        result = predict(model, contents)
    except ValueError as e:
        # Image quality validation failures
        raise HTTPException(422, str(e))

    # Update counters
    _stats["total"] += 1
    _stats["pneumonia" if result["prediction"] == "PNEUMONIA" else "normal"] += 1

    # Grad-CAM
    try:
        from app.gradcam import compute_gradcam, overlay_heatmap
        img    = Image.open(io.BytesIO(contents)).convert("RGB")
        tensor = TRANSFORM(img).unsqueeze(0)
        pred_idx = 1 if result["prediction"] == "PNEUMONIA" else 0
        cam = compute_gradcam(model, tensor, pred_idx)
        result["gradcam"] = overlay_heatmap(cam, contents)
    except Exception as e:
        print(f"Grad-CAM skipped: {e}")
        result["gradcam"] = None

    _log(contents, result)
    return result


# ── Batch predict ──────────────────────────────────────────────────────────
@app.post("/predict-batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    if len(files) > 5:
        raise HTTPException(400, "Maximum 5 files per batch")

    import asyncio

    async def _process(f: UploadFile):
        contents = await f.read()
        if not f.content_type.startswith("image/"):
            return {"filename": f.filename, "error": "Not an image"}
        try:
            res = predict(model, contents)
            res["filename"] = f.filename
            _stats["total"] += 1
            _stats["pneumonia" if res["prediction"] == "PNEUMONIA" else "normal"] += 1
            return res
        except ValueError as e:
            return {"filename": f.filename, "error": str(e)}

    results = await asyncio.gather(*[_process(f) for f in files])
    return {"results": results, "count": len(results)}


# ── Active learning / doctor feedback ─────────────────────────────────────
class FeedbackPayload(BaseModel):
    image_hash: str
    prediction: str
    agreed: bool

@app.post("/feedback")
def feedback_endpoint(payload: FeedbackPayload):
    if payload.agreed:
        _stats["agreed"] += 1
    else:
        _stats["disagreed"] += 1
    return {"status": "recorded", "message": "Thank you — your feedback improves the model!"}


# ── Augmentation preview ───────────────────────────────────────────────────
from torchvision import transforms as T
import base64

AUG = T.Compose([
    T.RandomHorizontalFlip(p=0.5),
    T.RandomRotation(15),
    T.ColorJitter(brightness=0.3, contrast=0.3),
    T.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    T.Resize((224, 224)),
])

@app.post("/augment-preview")
async def augment_preview(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    imgs_b64 = []
    for _ in range(9):
        aug = AUG(img)
        buf = io.BytesIO()
        aug.save(buf, format="JPEG", quality=70)
        imgs_b64.append("data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode())
    return {"augmented_images": imgs_b64}


# ── Risk assessment ─────────────────────────────────────────────────────────
class SurveyPayload(BaseModel):
    survey:     dict
    prediction: str

@app.post("/assess-risk")
def assess_risk_endpoint(payload: SurveyPayload):
    return assess_risk(payload.survey, payload.prediction)


# ── Live metrics ────────────────────────────────────────────────────────────
@app.get("/metrics")
def metrics():
    with open("app/metrics_data.json") as f:
        static = json.load(f)

    # Attach live counters
    static["live"] = {
        "total_predictions": _stats["total"],
        "pneumonia_count":   _stats["pneumonia"],
        "normal_count":      _stats["normal"],
        "doctor_agreed":     _stats["agreed"],
        "doctor_disagreed":  _stats["disagreed"],
    }
    return static


# ── Calibration data ────────────────────────────────────────────────────────
@app.get("/calibration-data")
def calibration_data():
    with open("app/metrics_data.json") as f:
        data = json.load(f)
    return data["calibration_curve"]