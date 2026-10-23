FROM python:3.10-slim

# Cài đặt thư viện hệ thống cần thiết cho OpenCV/YOLO và curl cho healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Tạo user non-root
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Tận dụng cache layer Docker bằng cách copy dependencies trước
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn backend
COPY . .

# Cấp quyền cho appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Healthcheck qua endpoint /health đã làm ở tuần 2
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
