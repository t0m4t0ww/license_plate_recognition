import cv2
import io
import base64
import numpy as np
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO
from paddleocr import PaddleOCR
import torch
import threading
import time

# Override torch.load nếu cần
_original_torch_load = torch.load
def custom_torch_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)
torch.load = custom_torch_load

# Khởi tạo model
model_path = "license_plate_recognition/models/best.pt"
yolo_model = YOLO(model_path)
ocr = PaddleOCR(use_angle_cls=True, lang='en')

app = Flask(__name__)
CORS(app)

# Shared state
shared_frame = None
processed_frame = None
frame_lock = threading.Lock()
process_lock = threading.Lock()
webcam_thread_started = False
webcam_thread_lock = threading.Lock()

# Encode ảnh sang base64
def base64_encode_image(img_np):
    _, buffer = cv2.imencode('.jpg', img_np)
    return base64.b64encode(buffer).decode('utf-8')

# Hàm nhận diện biển số
def detect_plates(image):
    results = yolo_model(image)
    boxes = results[0].boxes.xyxy
    confidences = results[0].boxes.conf.cpu().numpy().tolist() if results[0].boxes.conf is not None else []
    annotated = image.copy()
    plate_outputs = []
    all_text = []
    conf_values = []

    for idx, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box[:4])
        plate_img = image[y1:y2, x1:x2]
        if plate_img.shape[0] < 15 or plate_img.shape[1] < 40:
            continue

        conf = float(confidences[idx]) if idx < len(confidences) else 1.0
        conf_values.append(conf)

        gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
        enhanced = cv2.equalizeHist(gray)
        preprocessed = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

        ocr_results = ocr.ocr(preprocessed, cls=True)
        plate_text = "(không đọc được)"
        if ocr_results and len(ocr_results[0]) > 0:
            plate_text = " ".join([line[1][0] for line in ocr_results[0]])

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(annotated, plate_text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        plate_outputs.append({
            "image": base64_encode_image(plate_img),
            "text": plate_text
        })
        all_text.append(plate_text)

    avg_conf = (sum(conf_values) / len(conf_values)) * 100 if conf_values else 0.0
    return annotated, plate_outputs, "\n".join(all_text), avg_conf

# Webcam capture thread
def webcam_capture():
    global shared_frame
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    while True:
        ret, frame = cap.read()
        if ret:
            with frame_lock:
                shared_frame = frame
        time.sleep(0.01)

# Frame detection thread
def frame_processing():
    global shared_frame, processed_frame
    while True:
        with frame_lock:
            frame = shared_frame.copy() if shared_frame is not None else None
        if frame is not None:
            annotated, _, _, _ = detect_plates(frame)
            with process_lock:
                processed_frame = annotated
        time.sleep(0.1)

# Route xử lý ảnh
@app.route("/detect", methods=["POST"])
def detect():
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "No image uploaded"}), 400

    np_arr = np.frombuffer(file.read(), np.uint8)
    image_cv = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    annotated, plates, text, confidence = detect_plates(image_cv)

    return jsonify({
        "annotated_image": base64_encode_image(annotated),
        "gallery": plates,
        "text": text,
        "confidence": confidence
    })

# Route webcam — khởi động thread tại đây
@app.route("/webcam", methods=["GET"])
def webcam():
    global webcam_thread_started

    with webcam_thread_lock:
        if not webcam_thread_started:
            threading.Thread(target=webcam_capture, daemon=True).start()
            threading.Thread(target=frame_processing, daemon=True).start()
            webcam_thread_started = True

    def generate():
        while True:
            with process_lock:
                frame = processed_frame.copy() if processed_frame is not None else None
            if frame is not None:
                _, buffer = cv2.imencode('.jpg', frame)
                frame_encoded = buffer.tobytes()
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_encoded + b'\r\n')
            time.sleep(0.03)

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")

# Route xử lý video
@app.route("/video", methods=["GET"])
def video():
    cap = cv2.VideoCapture("test_video.mp4")

    def generate():
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            annotated, _, _, _ = detect_plates(frame)
            _, buffer = cv2.imencode('.jpg', annotated)
            frame_encoded = buffer.tobytes()
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_encoded + b'\r\n')

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")

# Start Flask server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, threaded=True)
