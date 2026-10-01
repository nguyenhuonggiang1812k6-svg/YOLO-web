import base64
import io
import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO

app = FastAPI(
    title="YOLO Web Application API",
    description="Backend API for image detection using YOLO",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
  return {"status": "healthy"}


@app.post("/api/detect/image")
async def detect_image(
    file: UploadFile = File(...), confidence: float = 0.25
):
  if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
    raise HTTPException(
        status_code=400,
        detail=(
            "Invalid file type. Only JPG, JPEG, and PNG are supported."
        ),
    )

  try:
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
      raise HTTPException(
          status_code=400, detail="Could not decode image file."
      )

    import time

    start_time = time.time()
    results = model(img, conf=confidence)
    processing_time = time.time() - start_time

    result = results[0]
    detections = []
    class_names = result.names

    for box in result.boxes:
      cls_id = int(box.cls[0])
      conf = float(box.conf[0])
      xyxy = box.xyxy[0].tolist()
      detections.append({
          "class_id": cls_id,
          "class_name": class_names[cls_id],
          "confidence": round(conf, 4),
          "box": {
              "xmin": round(xyxy[0], 2),
              "ymin": round(xyxy[1], 2),
              "xmax": round(xyxy[2], 2),
              "ymax": round(xyxy[3], 2),
          },
      })

    annotated_img = result.plot()
    _, encoded_img = cv2.imencode(".jpg", annotated_img)
    encoded_b64 = base64.b64encode(encoded_img).decode("utf-8")

    return JSONResponse(content={
        "filename": file.filename,
        "processing_time_seconds": round(processing_time, 4),
        "total_detections": len(detections),
        "detections": detections,
        "annotated_image_base64": encoded_b64,
    })

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

