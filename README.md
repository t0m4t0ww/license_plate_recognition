# License Plate Recognition — YOLOv11 + PaddleOCR

- Backend: Flask (Python 3.10)
- Frontend: React (thư mục `web/`)
- Model: `models/best.pt`

## Chạy backend
```bash
python -m venv venv310
# Windows: venv310\Scripts\activate
# macOS/Linux: source venv310/bin/activate
pip install -r requirements.txt
python server.py   # http://localhost:8000 (GET /health)
