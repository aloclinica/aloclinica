FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=3 \
    TF_USE_LEGACY_KERAS=1 \
    DEEPFACE_HOME=/root

# libgl1/libglib2.0-0 are needed by opencv; curl for the healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CPU-only torch first (DeepFace anti-spoofing/Fasnet needs it) — avoids CUDA.
RUN pip install --no-cache-dir torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

# NB: sem HEALTHCHECK no Dockerfile — o EasyPanel/Traefik faz a checagem de
# saude dele mesmo; um HEALTHCHECK aqui faz o Swarm segurar o container como
# "unhealthy" e o proxy nao roteia (502). O modelo leva ~180s pra carregar,
# entao chamadas iniciais podem falhar-aberto (ANTISPOOF_REQUIRED=false).

# Single worker: the model is loaded once per process; 1 worker keeps RAM low.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
