import os
import numpy as np
from PIL import Image

import tensorflow as tf
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import Flatten, BatchNormalization, Dense, Dropout, Activation
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input

IMG_SIZE = (224, 224)

def build_same_architecture():
    base = ResNet50(input_shape=(224, 224, 3), weights='imagenet', include_top=False)
    model = Sequential([
        base,
        Flatten(),
        BatchNormalization(),
        Dense(256, kernel_initializer='he_uniform'),
        BatchNormalization(),
        Activation('relu'),
        Dropout(0.5),
        Dense(1, activation='sigmoid'),
    ])
    for layer in base.layers:
        layer.trainable = False
    # Compile mirrors notebook; not required for inference but harmless
    model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy', 'AUC'])
    return model

def load_keras_model(weights_path: str | None = None):
    """
    If you saved the FULL model (.h5 via model.save), we load it directly.
    If you saved only weights, we rebuild the same architecture then load_weights.
    """
    if weights_path and os.path.exists(weights_path):
        name = os.path.basename(weights_path).lower()
        if name.endswith(".h5") and "weights" not in name:   # full model
            return load_model(weights_path, compile=False)
        # weights only
        m = build_same_architecture()
        m.load_weights(weights_path)
        return m
    # fallback for smoke test
    return build_same_architecture()

def preprocess_pil(img: Image.Image) -> np.ndarray:
    if img.mode != "RGB":
        img = img.convert("RGB")
    img = img.resize(IMG_SIZE, Image.BICUBIC)
    x = np.array(img, dtype=np.float32)
    x = preprocess_input(x)  # ResNet50 preprocessing
    x = np.expand_dims(x, axis=0)
    return x

def predict(model, img: Image.Image) -> tuple[str, float]:
    """
    Binary classifier: sigmoid -> [0,1]
    >= 0.5 => 'tumor', else 'no_tumor'
    """
    x = preprocess_pil(img)
    prob = float(model.predict(x, verbose=0)[0][0])
    label = "tumor" if prob >= 0.5 else "no_tumor"
    conf = prob if label == "tumor" else (1.0 - prob)
    return label, conf
