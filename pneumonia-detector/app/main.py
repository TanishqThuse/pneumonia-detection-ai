from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.model import load_model, predict
import os

app = FastAPI(title="Pneumonia Detector API")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("MODEL_PATH", "app/best_model.pth")
model = load_model(MODEL_PATH)
print("Model loaded successfully")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large — max 10MB")
    return predict(model, contents)