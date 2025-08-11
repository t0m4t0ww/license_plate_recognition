# License Plate Recognition — YOLOv11 + PaddleOCR

Hệ thống phát hiện **biển số** và **đọc ký tự** từ **ảnh / video / webcam**.

- **Detect**: YOLOv11 (`models/best.pt`)
- **OCR**: PaddleOCR
- **Backend**: Flask (Python 3.10)
- **Frontend**: React (thư mục `web/`)

---

## 1) Yêu cầu hệ thống
- Python **3.10+**
- Node.js **18+** (để chạy frontend)
- (Tuỳ chọn) CUDA nếu muốn chạy GPU

---

## 2) Cấu trúc thư mục
```
.
├─ models/
│  └─ best.pt            # YOLOv11 weights (đã có sẵn, size ~5MB)
├─ plates/               # ảnh/video mẫu (tuỳ)
├─ web/                  # React frontend
├─ requirements.txt
├─ server.py             # Flask API
└─ README.md
```

> Khuyến nghị tạo virtual env **ngoài** repo để repo nhẹ. (VD: `..\venv310`)

---

## 3) Chạy Backend (Flask)
```bash
# Tạo & kích hoạt virtual env (khuyên để ngoài repo)
python -m venv ..\venv310
# Windows:
..\venv310\Scripts\activate
# macOS/Linux:
source ../venv310/bin/activate

# Cài thư viện
pip install -r requirements.txt

# Đảm bảo model nằm ở: models/best.pt
# Chạy server
python server.py
```

- Mặc định API chạy tại: **http://localhost:8000**
- Healthcheck: **GET** `http://localhost:8000/health`

---

## 4) Chạy Frontend (web/)
```bash
cd web
npm install
echo "VITE_API_BASE=http://localhost:8000" > .env
npm run dev    # http://localhost:5173
```

> Frontend gọi API qua biến `VITE_API_BASE`. Sửa `.env` nếu bạn đổi cổng.

---

## 5) API Endpoints

| Method | Endpoint   | Mô tả |
|-------:|------------|-------|
| POST   | `/detect`  | Upload **ảnh** → trả về JSON + ảnh annotate (Base64) |
| GET    | `/video`   | Stream **video** đã xử lý (MJPEG). Dùng trực tiếp trong `<img src>` |
| GET    | `/webcam`  | Stream **webcam** real-time (MJPEG). Dùng trực tiếp trong `<img src>` |

### Ví dụ hiển thị stream trên frontend
```html
<img src="http://localhost:8000/video" alt="video stream" />
<img src="http://localhost:8000/webcam" alt="webcam stream" />
```

### Test nhanh với cURL
```bash
curl -X POST http://localhost:8000/detect   -F "file=@path/to/your_image.jpg"
```

---

## 6) Troubleshooting
- **CORS**: đảm bảo đã bật `flask-cors` trong backend.
- **Port busy**: đổi port trong `server.py` hoặc chạy `npm run dev -- --port 5174`.
- **Torch/weights**: nếu lỗi load `.pt`, kiểm tra phiên bản `torch` và CPU/GPU phù hợp.
- **Hiệu năng**: GPU nhanh hơn đáng kể; nếu dùng CPU, ảnh lớn → thời gian xử lý tăng.

---

## 7) Gợi ý Git (push repo)
```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/<username>/license_plate_recognition.git
git push -u origin main
```

> Đã cấu hình `.gitignore` để **không** đẩy `venv` và `node_modules`. Model `models/best.pt` (~5MB) được push bình thường.

---

## 8) License
MIT 
