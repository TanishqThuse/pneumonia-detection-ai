"""
Run this script to see the raw model output for any image.
Usage: python debug_model.py <path_to_image>
Example: python debug_model.py test.jpg
"""
import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

# --- Load model ---
DEVICE = torch.device("cpu")
MODEL_PATH = "app/best_model.pth"

model = models.densenet121(weights=None)
model.classifier = nn.Sequential(
    nn.Linear(model.classifier.in_features, 256),
    nn.ReLU(),
    nn.Dropout(0.4),
    nn.Linear(256, 2)
)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()
print("✅ Model loaded successfully\n")

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])

# --- Test with a solid white image (should be NORMAL) ---
print("=" * 50)
print("TEST 1: Solid WHITE image (expected: NORMAL)")
white_img = Image.new("RGB", (224, 224), color=(255, 255, 255))
tensor = TRANSFORM(white_img).unsqueeze(0)
with torch.no_grad():
    output = model(tensor)
    probs = F.softmax(output, dim=1)[0]
print(f"  Raw logits: {output[0].tolist()}")
print(f"  NORMAL:    {probs[0].item()*100:.2f}%")
print(f"  PNEUMONIA: {probs[1].item()*100:.2f}%")
print(f"  argmax says: {'NORMAL' if probs.argmax().item() == 0 else 'PNEUMONIA'}")

# --- Test with a solid black image (should be NORMAL) ---
print()
print("TEST 2: Solid BLACK image (expected: NORMAL)")
black_img = Image.new("RGB", (224, 224), color=(0, 0, 0))
tensor = TRANSFORM(black_img).unsqueeze(0)
with torch.no_grad():
    output = model(tensor)
    probs = F.softmax(output, dim=1)[0]
print(f"  Raw logits: {output[0].tolist()}")
print(f"  NORMAL:    {probs[0].item()*100:.2f}%")
print(f"  PNEUMONIA: {probs[1].item()*100:.2f}%")
print(f"  argmax says: {'NORMAL' if probs.argmax().item() == 0 else 'PNEUMONIA'}")

# --- Test with user-provided image ---
if len(sys.argv) > 1:
    img_path = sys.argv[1]
    print()
    print(f"TEST 3: Your image '{img_path}'")
    try:
        img = Image.open(img_path).convert("RGB")
        tensor = TRANSFORM(img).unsqueeze(0)
        with torch.no_grad():
            output = model(tensor)
            probs = F.softmax(output, dim=1)[0]
        print(f"  Raw logits: {output[0].tolist()}")
        print(f"  NORMAL:    {probs[0].item()*100:.2f}%")
        print(f"  PNEUMONIA: {probs[1].item()*100:.2f}%")
        print(f"  argmax says: {'NORMAL' if probs.argmax().item() == 0 else 'PNEUMONIA'}")
    except Exception as e:
        print(f"  Error: {e}")

print()
print("=" * 50)
print("DIAGNOSIS:")
print("If TEST 1 & 2 also say PNEUMONIA, the model weights are too biased.")
print("Paste the output above to figure out the correct threshold.")
