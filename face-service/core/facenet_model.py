"""
FaceNet Model
=============
Singleton wrapper around facenet-pytorch's InceptionResnetV1.

Model: InceptionResnetV1 pretrained on VGGFace2
Output: 512-dimensional L2-normalized face embedding vector

The model is loaded once at startup and reused for all requests.
GPU is used if available, otherwise CPU.
"""

import logging
from typing import Optional

import torch
from facenet_pytorch import InceptionResnetV1

logger = logging.getLogger("face-service.facenet")

# Module-level singleton
_model: Optional[InceptionResnetV1] = None
_device: Optional[torch.device] = None

MODEL_VERSION = "vggface2"


def get_model() -> InceptionResnetV1:
    """
    Return the cached FaceNet model, loading it on first call.
    Thread-safe for FastAPI's async context (single process, single load).
    """
    global _model, _device

    if _model is None:
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Loading InceptionResnetV1 (pretrained={MODEL_VERSION}) on {_device}…")

        _model = InceptionResnetV1(pretrained=MODEL_VERSION).eval().to(_device)

        # Count parameters for confirmation log
        param_count = sum(p.numel() for p in _model.parameters())
        logger.info(f"FaceNet loaded — {param_count:,} parameters, device={_device}")

    return _model


def get_device() -> torch.device:
    """Return the device the model is running on."""
    if _device is None:
        get_model()
    return _device
