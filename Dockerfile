# --- Stage 1: build the Vite SPA ---
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# VITE_API_BASE is unset → the SPA calls same-origin /api in production.
RUN npm run build

# --- Stage 2: Python runtime serving the SPA + API ---
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
# Built SPA goes where Flask's STATIC_DIR points.
COPY --from=frontend /app/frontend/dist ./static
ENV STATIC_DIR=/app/static

# Render injects $PORT; default to 5001 for local runs.
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5001}"]
