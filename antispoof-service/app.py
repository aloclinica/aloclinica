"""
AloClinica — passive face anti-spoofing microservice.

Wraps DeepFace's anti-spoofing (MiniFASNet/Fasnet) behind a tiny HTTP API so the
Supabase edge function `didit-kyc` can ask "is this selfie a live face or a
photo/screen/mask?". Self-hosted alongside CompreFace; free.

POST /check  { "image": "<dataURL or base64>" }  -> { faces, real, score }
GET  /health -> { status: "ok" }

Requires header  x-api-key: <ANTISPOOF_API_KEY>  when that env var is set.
"""
import os
import base64

import numpy as np
import cv2
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from deepface import DeepFace

API_KEY = os.environ.get("ANTISPOOF_API_KEY", "")
DETECTOR = os.environ.get("ANTISPOOF_DETECTOR", "opencv")  # opencv = light, no extra model

app = FastAPI(title="AloClinica Anti-Spoof", version="1.0.0")


class CheckReq(BaseModel):
    image: str


def _decode(data: str) -> np.ndarray:
    if data.strip().startswith("data:") and "," in data:
        data = data.split(",", 1)[1]
    raw = base64.b64decode(data)
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("invalid image")
    return img


@app.on_event("startup")
def _warmup() -> None:
    # Force model download/load at boot so the first real request isn't slow.
    try:
        dummy = np.zeros((160, 160, 3), dtype=np.uint8)
        DeepFace.extract_faces(
            img_path=dummy,
            detector_backend=DETECTOR,
            anti_spoofing=True,
            enforce_detection=False,
        )
    except Exception:
        pass


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/check")
def check(req: CheckReq, x_api_key: str | None = Header(default=None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")
    try:
        img = _decode(req.image)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid image")

    try:
        faces = DeepFace.extract_faces(
            img_path=img,
            detector_backend=DETECTOR,
            anti_spoofing=True,
            enforce_detection=True,
        )
    except ValueError:
        # No face detected — treat as not-real (fail the check).
        return {"faces": 0, "real": False, "score": 0.0}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"antispoof failed: {e}")

    if not faces:
        return {"faces": 0, "real": False, "score": 0.0}

    # Evaluate the largest face in frame.
    f = max(faces, key=lambda x: (x.get("facial_area", {}) or {}).get("w", 0))
    return {
        "faces": len(faces),
        "real": bool(f.get("is_real", False)),
        "score": float(f.get("antispoof_score", 0.0)),
    }
