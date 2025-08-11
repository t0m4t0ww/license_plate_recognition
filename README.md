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
> Kích hoạt venv bằng lệnh .\venv310\Scripts\activate     

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

- Mặc định API chạy tại: **http://localhost:5000**
- Healthcheck: **GET** `http://localhost:5000/health`

---

## 4) Chạy Frontend (web/)
```bash
cd web
npm install
npm run dev    # http://localhost:3000

```
## 5) API Endpoints

| Method | Endpoint   | Mô tả |
|-------:|------------|-------|
| POST   | `/detect`  | Upload **ảnh** → trả về JSON + ảnh annotate (Base64) |
| GET    | `/video`   | Stream **video** đã xử lý (MJPEG). Dùng trực tiếp trong `<img src>` |
| GET    | `/webcam`  | Stream **webcam** real-time (MJPEG). Dùng trực tiếp trong `<img src>` |

---

## 8) License
MIT 
