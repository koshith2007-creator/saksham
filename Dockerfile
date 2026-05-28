# ============================================================
# SAKSHAM Backend - Railway fallback Dockerfile
# ============================================================
#
# Railway should deploy from the `backend` root, where `backend/Dockerfile`
# is the primary backend Dockerfile. This root Dockerfile is intentionally
# backend-focused as a fallback for platforms that build from the repo root.
# The frontend is deployed by Vercel and does not use this Dockerfile.

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN mkdir -p /tmp/saksham-scans

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
