"""
Face Detection and Alignment
============================
Uses MTCNN (Multi-task Cascaded Convolutional Networks) from facenet-pytorch.
MTCNN handles:
  - Face detection with bounding boxes
  - Landmark detection (eyes, nose, mouth corners)
  - Automatic face alignment (rotation correction)
  - Output: 160×160 aligned face tensor

Validation rules:
  - Exactly ONE face must be detected
  - Detection confidence must be > 0.95
  - Face bounding box must be at least 80×80 pixels
"""

import logging
from typing import Optional

import numpy as np
import torch
from PIL import Image
from facenet_pytorch import MTCNN

logger = logging.getLogger("face-service.detection")

# Minimum acceptable face size (pixels) in the original image
MIN_FACE_SIZE_PX = 60

# Minimum MTCNN detection probability
MIN_CONFIDENCE = 0.85

# Singleton MTCNN instance (CPU by default for portability)
_mtcnn: Optional[MTCNN] = None


def _get_mtcnn() -> MTCNN:
    global _mtcnn
    if _mtcnn is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _mtcnn = MTCNN(
            image_size=160,          # output face size
            margin=20,               # pixels of context around the face
            min_face_size=40,        # smallest face to detect (in image pixels)
            thresholds=[0.6, 0.7, 0.7],  # P-Net, R-Net, O-Net thresholds
            factor=0.709,            # scale factor for image pyramid
            post_process=False,      # return raw pixel tensor, not normalized
            keep_all=True,           # keep ALL detected faces so we can count them
            device=device,
        )
        logger.info(f"MTCNN initialized on {device}")
    return _mtcnn


def detect_and_align(img_bgr: np.ndarray) -> torch.Tensor:
    """
    Detect and align a face from a BGR NumPy image (OpenCV format).

    Returns:
        torch.Tensor of shape (3, 160, 160) — aligned face, pixel values [0, 255]

    Raises:
        ValueError: with a user-friendly reason string if detection fails
    """
    import cv2

    mtcnn = _get_mtcnn()

    # Convert BGR → RGB for MTCNN / PIL
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(img_rgb)

    # Detect all faces + probabilities + bounding boxes + landmarks
    boxes, probs, landmarks = mtcnn.detect(pil_image, landmarks=True)

    # -----------------------------------------------------------------------
    # Validation: face count
    # -----------------------------------------------------------------------
    if boxes is None or len(boxes) == 0:
        raise ValueError("No face detected. Please ensure your face is clearly visible and well-lit.")

    if len(boxes) > 1:
        raise ValueError(
            f"{len(boxes)} faces detected in the image. "
            "Please ensure only one person is visible."
        )

    # -----------------------------------------------------------------------
    # Validation: confidence
    # -----------------------------------------------------------------------
    confidence = float(probs[0])
    if confidence < MIN_CONFIDENCE:
        raise ValueError(
            f"Low detection confidence ({confidence:.2f}). "
            "Please improve lighting and ensure your face is clearly visible."
        )

    # -----------------------------------------------------------------------
    # Validation: face size
    # -----------------------------------------------------------------------
    x1, y1, x2, y2 = boxes[0]
    face_w = x2 - x1
    face_h = y2 - y1

    if face_w < MIN_FACE_SIZE_PX or face_h < MIN_FACE_SIZE_PX:
        raise ValueError(
            f"Face too small ({int(face_w)}×{int(face_h)} px). "
            f"Please move closer to the camera (minimum {MIN_FACE_SIZE_PX}px required)."
        )

    # -----------------------------------------------------------------------
    # Extract aligned face tensor
    # -----------------------------------------------------------------------
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    mtcnn_single = MTCNN(
        image_size=160,
        margin=20,
        min_face_size=40,
        thresholds=[0.6, 0.7, 0.7],
        factor=0.709,
        post_process=False,
        keep_all=False,
        device=device,
    )

    face_tensor = mtcnn_single(pil_image)  # shape: (3, 160, 160) or None

    if face_tensor is None:
        raise ValueError(
            "Face was detected but could not be aligned. "
            "Please try again with better lighting."
        )

    first_landmarks = landmarks[0] if (landmarks is not None and len(landmarks) > 0) else None

    logger.debug(
        f"Face detected — bbox=({int(x1)},{int(y1)},{int(x2)},{int(y2)}), "
        f"size={int(face_w)}×{int(face_h)}, confidence={confidence:.3f}"
    )

    return face_tensor, first_landmarks
