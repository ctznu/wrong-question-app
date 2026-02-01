# OCR backend (Flask + pytesseract)

This small service accepts image uploads and returns OCR text and parsed fields.

Prerequisites
- Python 3.8+
- Tesseract OCR binary installed on the host

Windows Tesseract install (example):

1. Install via Chocolatey (or download installer from the Tesseract project):
```powershell
choco install -y tesseract
```

2. Note the installation path (e.g., `C:\Program Files\Tesseract-OCR\tesseract.exe`). If not on PATH, edit `app.py` and set `pytesseract.pytesseract.tesseract_cmd` accordingly.

Setup

```bash
python -m venv venv
venv\\Scripts\\activate            # Windows
pip install -r requirements.txt
```

Run

```bash
python app.py
```

Endpoint
- POST `/ocr` - form field `file` (multipart). Returns JSON:
```json
{
  "text": "full recognized text",
  "question": "parsed question",
  "correctAnswer": "...",
  "wrongAnswer": "...",
  "reason": "...",
  "tags": "..."
}
```

Notes
- You can improve accuracy by adding more preprocessing in `app.py` (resize, binarize, contrast).
- For production or high-volume use, consider using a cloud OCR API (Google/Azure) for better accuracy and scalability.
