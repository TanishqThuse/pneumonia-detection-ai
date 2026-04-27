from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.model import load_model, predict, TRANSFORM
from app.risk import assess_risk
import os, io
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large — max 10 MB")

    result = predict(model, contents)

    # ── Grad-CAM ────────────────────────────────────────────────────────────
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

    return result


# ── Risk / Medicine endpoint ─────────────────────────────────────────────────
class SurveyPayload(BaseModel):
    survey:     dict
    prediction: str   # "NORMAL" or "PNEUMONIA"


@app.post("/assess-risk")
def assess_risk_endpoint(payload: SurveyPayload):
    return assess_risk(payload.survey, payload.prediction)