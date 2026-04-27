import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
import io

DEVICE  = torch.device("cpu")
CLASSES = ["NORMAL", "PNEUMONIA"]

# ── Calibration constants ──────────────────────────────────────────────────
# 1. Temperature scaling: divides logits by T before softmax.
#    T > 1 spreads the distribution, reducing overconfidence.
TEMPERATURE = 2.5

# 2. Prior correction: training set was ~3:1 PNEUMONIA:NORMAL (heavily imbalanced).
#    We subtract log(3) ≈ 1.099 from the PNEUMONIA logit so the model's prior
#    matches a balanced real-world scenario. This is a standard Bayesian fix.
PRIOR_CORRECTION = math.log(3)   # ≈ 1.099

# 3. Decision threshold: after calibration, require >= 55% to call PNEUMONIA.
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


def predict(model, image_bytes: bytes) -> dict:
    image  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        raw_logits = model(tensor)[0]           # shape: [2]

    # Step 1 – Temperature scaling
    scaled = raw_logits / TEMPERATURE

    # Step 2 – Prior correction (reduce PNEUMONIA bias from imbalanced training)
    corrected = scaled.clone()
    corrected[1] -= PRIOR_CORRECTION

    # Step 3 – Softmax to get calibrated probabilities
    probs = F.softmax(corrected, dim=0)
    pneumonia_prob = probs[1].item()

    # Step 4 – Threshold decision
    pred_idx = 1 if pneumonia_prob >= PNEUMONIA_THRESHOLD else 0

    return {
        "prediction":    CLASSES[pred_idx],
        "confidence":    round(probs[pred_idx].item() * 100, 2),
        "probabilities": {
            "NORMAL":    round(probs[0].item() * 100, 2),
            "PNEUMONIA": round(probs[1].item() * 100, 2),
        },
    }