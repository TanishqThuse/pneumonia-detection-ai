"""
Grad-CAM implementation for DenseNet-121.
Hooks the last dense block to extract spatial activation maps and gradients.
"""
import io
import base64
import numpy as np
import cv2
import torch
import torch.nn.functional as F
from PIL import Image


def compute_gradcam(model, tensor: torch.Tensor, class_idx: int) -> np.ndarray:
    """
    Runs a forward + backward pass and returns a normalised Grad-CAM
    heatmap as a float32 numpy array with shape (H, W) and values in [0, 1].
    """
    activations: dict = {}
    gradients:   dict = {}

    def _fwd(_, __, out):
        activations['x'] = out

    def _bwd(_, __, grad_out):
        gradients['x'] = grad_out[0]

    # Hook the last DenseBlock — output: [B, 1024, h, w] for 224×224 input
    h_fwd = model.features.denseblock4.register_forward_hook(_fwd)
    try:
        h_bwd = model.features.denseblock4.register_full_backward_hook(_bwd)
    except AttributeError:                          # PyTorch < 1.8 fallback
        h_bwd = model.features.denseblock4.register_backward_hook(_bwd)

    try:
        model.eval()
        t = tensor.detach().clone().requires_grad_(True)

        out = model(t)
        model.zero_grad()
        out[0, class_idx].backward()

        grads = gradients['x']    # [1, C, h, w]
        acts  = activations['x']  # [1, C, h, w]

        weights = grads.mean(dim=[2, 3])              # [1, C]
        cam = (weights[:, :, None, None] * acts).sum(dim=1).squeeze(0)
        cam = F.relu(cam).detach().cpu().numpy()

        if cam.max() > cam.min():
            cam = (cam - cam.min()) / (cam.max() - cam.min())
        else:
            cam = np.zeros_like(cam)
    finally:
        h_fwd.remove()
        h_bwd.remove()

    return cam


def overlay_heatmap(cam: np.ndarray, image_bytes: bytes) -> str:
    """
    Blends a Grad-CAM heatmap over the original X-ray.
    Returns a base64-encoded PNG data URI ready for <img src=…>.
    """
    img = np.array(
        Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((224, 224))
    )
    cam_up  = cv2.resize(cam, (224, 224))
    heat    = cv2.applyColorMap(np.uint8(255 * cam_up), cv2.COLORMAP_JET)
    heat    = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB)
    blended = np.uint8(0.42 * heat + 0.58 * img)

    buf = io.BytesIO()
    Image.fromarray(blended).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
