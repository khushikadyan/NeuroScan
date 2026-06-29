import numpy as np
import cv2
from PIL import Image
import tensorflow as tf

# If your saved model ALREADY has a Rescaling/Preprocessing layer, set this False
USE_EXTERNAL_PREPROCESS = True  # keep True to match your training

def infer_input_size(model) -> tuple[int, int]:
    ish = model.input_shape
    if isinstance(ish, (list, tuple)):
        shp = ish[0] if isinstance(ish[0], (list, tuple)) else ish
        h, w = shp[1], shp[2]
    else:
        h = w = None
    return int(h or 224), int(w or 224)

def _crop_single(img_rgb: np.ndarray, add_pixels: int = 8) -> np.ndarray:
    """
    img_rgb: HxWx3, RGB (uint8)
    Returns cropped RGB.
    """
    h, w = img_rgb.shape[:2]
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh = cv2.erode(thresh, None, iterations=1)
    thresh = cv2.dilate(thresh, None, iterations=1)

    cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        x0, y0, x1, y1 = 0, 0, w, h
    else:
        c = max(cnts, key=cv2.contourArea)
        x, y, cw, ch = cv2.boundingRect(c)
        x0 = max(0, x - add_pixels)
        y0 = max(0, y - add_pixels)
        x1 = min(w, x + cw + add_pixels)
        y1 = min(h, y + ch + add_pixels)
        if x1 <= x0 or y1 <= y0:
            x0, y0, x1, y1 = 0, 0, w, h

    return img_rgb[y0:y1, x0:x1]

def preprocess_for_model(img_pil: Image.Image, model) -> np.ndarray:
    """
    Replicates your training prep:
    1) Convert to RGB
    2) Crop around foreground
    3) Resize to model input size
    4) ResNet50 preprocess_input (if external preprocessing is used)
    Returns: (1, H, W, 3) float32
    """
    rgb = img_pil.convert("RGB")
    arr = np.asarray(rgb)
    crop = _crop_single(arr)  # RGB
    h, w = infer_input_size(model)
    crop_resized = cv2.resize(crop, (w, h), interpolation=cv2.INTER_AREA)
    x = crop_resized.astype("float32")
    x = np.expand_dims(x, axis=0)
    if USE_EXTERNAL_PREPROCESS:
        x = tf.keras.applications.resnet50.preprocess_input(x)
    return x
