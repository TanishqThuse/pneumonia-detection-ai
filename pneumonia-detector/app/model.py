import math
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
import io
import numpy as np

DEVICE  = torch.device("cpu")
CLASSES = ["NORMAL", "PNEUMONIA"]

# ── Calibration constants ──────────────────────────────────────────────────
TEMPERATURE       = 2.5
PRIOR_CORRECTION  = math.log(3)   # ≈ 1.099
PNEUMONIA_THRESHOLD = 0.55
# ──────────────────────────────────────────────────────────────────────────


def load_model(weights_path: str):
    model = models.densenet121(weights=None)
    model.classifier = nn.Sequential(
        nn.Linear(model.classifier.in_features, 256),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(256, 2)
    )
    model.load_state_dict(torch.load(weights_path, map_location=DEVICE))
    model.eval()
    return model


TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])


def get_severity(pneumonia_prob: float) -> dict:
    """Map raw probability to a 4-tier clinical severity level."""
    if pneumonia_prob < 0.55:
        return {"level": "NORMAL",   "color": "#22c55e",
                "action": "No pneumonia detected. Routine follow-up and preventive care advised."}
    elif pneumonia_prob < 0.70:
        return {"level": "MILD",     "color": "#eab308",
                "action": "Possible early-stage pneumonia. Clinical correlation and rest recommended."}
    elif pneumonia_prob < 0.85:
        return {"level": "MODERATE", "color": "#f97316",
                "action": "Probable pneumonia. Antibiotic therapy and medical review strongly advised."}
    else:
        return {"level": "SEVERE",   "color": "#ef4444",
                "action": "High-confidence pneumonia. Seek immediate medical attention or hospitalization."}


def validate_image_quality(image: Image.Image):
    """Raise ValueError with a clear message if the image is unsuitable for analysis."""
    w, h = image.size
    if w < 50 or h < 50:
        raise ValueError("Image too small (minimum 50×50 px). Please upload a full chest X-ray.")

    gray = np.array(image.convert("L"), dtype=float)
    mean_brightness = gray.mean()
    std_brightness  = gray.std()

    if mean_brightness < 8:
        raise ValueError("Image appears completely black. Please verify this is a valid X-ray file.")
    if std_brightness < 5:
        raise ValueError("Image is too uniform (possibly blank). Please upload a valid chest X-ray.")

    # Laplacian variance for blur detection (requires OpenCV — skip gracefully if absent)
    try:
        import cv2
        arr     = gray.astype(np.uint8)
        blur_score = cv2.Laplacian(arr, cv2.CV_64F).var()
        if blur_score < 15:
            raise ValueError(
                f"Image is too blurry (sharpness score: {blur_score:.1f}). "
                "Please upload a clearer X-ray for reliable analysis."
            )
    except ImportError:
        pass   # OpenCV not installed — skip blur check silently


# ── MC Dropout — Uncertainty Quantification ────────────────────────────────
def _enable_dropout(model):
    """Switch only Dropout layers to train mode so they fire at inference."""
    for m in model.modules():
        if isinstance(m, nn.Dropout):
            m.train()


def mc_dropout_predict(model, tensor: torch.Tensor, n_passes: int = 25) -> dict:
    """
    Run N stochastic forward passes with Dropout kept ON.
    Returns mean prediction + epistemic uncertainty (std dev).
    Gal & Ghahramani (2016) — 'Dropout as a Bayesian Approximation'.
    """
    _enable_dropout(model)
    preds = []
    with torch.no_grad():
        for _ in range(n_passes):
            raw     = model(tensor)[0]
            scaled  = raw / TEMPERATURE
            scaled[1] -= PRIOR_CORRECTION
            prob    = F.softmax(scaled, dim=0)
            preds.append(prob.cpu().numpy())

    model.eval()            # restore eval mode (Dropout OFF for normal forward passes)

    preds   = np.stack(preds)            # [n_passes, 2]
    mean    = preds.mean(axis=0)         # [2]
    std     = preds.std(axis=0)          # [2]

    pneumonia_prob  = float(mean[1])
    uncertainty_pct = round(float(std[1]) * 100, 2)     # convert to %

    # Certainty label
    if std[1] < 0.02:
        certainty = "HIGH"
    elif std[1] < 0.06:
        certainty = "MEDIUM"
    else:
        certainty = "LOW"

    pred_idx = 1 if pneumonia_prob >= PNEUMONIA_THRESHOLD else 0

    return {
        "prediction":    CLASSES[pred_idx],
        "confidence":    round(float(mean[pred_idx]) * 100, 2),
        "probabilities": {
            "NORMAL":    round(float(mean[0]) * 100, 2),
            "PNEUMONIA": round(float(mean[1]) * 100, 2),
        },
        "uncertainty":   uncertainty_pct,
        "certainty":     certainty,
        "severity":      get_severity(pneumonia_prob),
        "mc_passes":     n_passes,
    }


# ── Single deterministic predict (fast path) ──────────────────────────────
def predict(model, image_bytes: bytes) -> dict:
    """Full inference pipeline: validation → preprocess → calibrated predict."""
    t0    = time.perf_counter()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Quality gate
    validate_image_quality(image)

    t1     = time.perf_counter()
    tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)

    # Use MC Dropout for richer output (25 passes is fast on CPU, ~0.3s)
    result = mc_dropout_predict(model, tensor, n_passes=25)

    t2 = time.perf_counter()
    result["timing"] = {
        "preprocess_ms":  round((t1 - t0) * 1000, 1),
        "inference_ms":   round((t2 - t1) * 1000, 1),
        "total_ms":       round((t2 - t0) * 1000, 1),
    }
    return result