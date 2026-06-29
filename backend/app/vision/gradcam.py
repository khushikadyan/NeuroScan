import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from PIL import Image
import matplotlib.cm as cm

# If your model ALREADY has a built-in preprocessing/rescaling layer, set False
USE_EXTERNAL_PREPROCESS = True  # keep True if you trained with resnet50.preprocess_input

def ensure_built(model: tf.keras.Model, hw: tuple[int,int]) -> None:
    """
    Ensure model has concrete inputs/outputs by running a dummy forward pass.
    Works for Sequential models saved without an explicit Input layer.
    """
    try:
        # If inputs are already defined, nothing to do
        _ = model.inputs
        return
    except Exception:
        pass

    h, w = hw
    dummy = tf.zeros((1, h, w, 3), dtype=tf.float32)
    # A forward call defines the graph tensors
    _ = model(dummy, training=False)

def _find_last_conv_layer(model: tf.keras.Model) -> str:
    """
    Prefer typical ResNet50 last conv names; else return the last 4D output layer.
    (Requires model to be 'built' so layers have defined outputs.)
    """
    preferred = ["conv5_block3_out", "conv5_block3_3_conv", "conv5_block3_2_conv"]
    for name in preferred:
        try:
            lyr = model.get_layer(name)
            out = getattr(lyr, "output", None)
            if out is not None and len(out.shape) == 4:
                return lyr.name
        except Exception:
            pass

    # fallback: last layer with 4D output
    for layer in reversed(model.layers):
        try:
            out = getattr(layer, "output", None)
            if out is not None and len(out.shape) == 4:
                return layer.name
        except Exception:
            continue
    raise ValueError("No suitable 4D conv layer found for Grad-CAM")

def model_input_size(model: tf.keras.Model) -> tuple[int,int]:
    """Infer (H,W) from model.input_shape; default to (224,224)."""
    ish = model.input_shape
    if isinstance(ish, (list, tuple)):
        shape = ish[0] if isinstance(ish[0], (list, tuple)) else ish
        h, w = shape[1], shape[2]
    else:
        h = w = None
    return int(h or 224), int(w or 224)

def load_and_preprocess(img_path: str, target_size=(224, 224)):
    from tensorflow.keras.preprocessing import image as kimage
    x = Image.open(img_path).convert("RGB").resize(target_size, Image.BILINEAR)
    x = np.asarray(x).astype("float32")
    x = np.expand_dims(x, axis=0)
    if USE_EXTERNAL_PREPROCESS:
        x = tf.keras.applications.resnet50.preprocess_input(x)
    return x

def gradcam_heatmap(
    model: tf.keras.Model,
    img_array: np.ndarray,
    class_index: int,
    last_conv_name: str | None = None
):
    """
    Returns: (heatmap ndarray in [0,1], last_conv_layer_name)
    """
    # Ensure model has defined inputs/outputs
    h, w = img_array.shape[1], img_array.shape[2]
    ensure_built(model, (h, w))

    last_conv_name = last_conv_name or _find_last_conv_layer(model)
    conv_layer = model.get_layer(last_conv_name)

    # Build a model mapping input -> (last conv activations, predictions)
    grad_model = Model([model.inputs], [conv_layer.output, model.output])

    with tf.GradientTape() as tape:
        conv_outputs, preds = grad_model(img_array, training=False)
        class_channel = preds[:, class_index]

    grads = tape.gradient(class_channel, conv_outputs)           # dscore/dactivations
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))         # per-channel weights
    conv_outputs = conv_outputs[0]                                # H x W x C
    heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)
    heatmap = tf.nn.relu(heatmap)
    maxv = tf.reduce_max(heatmap) + 1e-8
    heatmap = heatmap / maxv
    return heatmap.numpy(), last_conv_name

def save_overlay(original_path: str, heatmap: np.ndarray, out_path: str, alpha: float = 0.35, colormap: str = "jet"):
    base = Image.open(original_path).convert("RGB")
    hm_img = Image.fromarray(np.uint8(255 * heatmap)).resize(base.size, Image.BILINEAR)

    cmap = cm.get_cmap(colormap)
    colored = cmap(np.asarray(hm_img) / 255.0)[:, :, :3]
    color_img = Image.fromarray(np.uint8(colored * 255))

    overlay = Image.blend(base, color_img, alpha=alpha)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    overlay.save(out_path)
    return out_path
