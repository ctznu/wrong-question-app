# AI Vision backend (Flask + AI Models)

This service accepts image uploads and returns intelligent analysis using AI vision models.

Prerequisites
- Python 3.8+
- API keys for AI services (ZhiPu AI or Tongyi Qianwen)

Setup

1. **Create virtual environment and install dependencies**
```bash
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
```

2. **Configure API keys**
Create a `.env` file in the `ocr_server` directory:
```env
# Flask settings
FLASK_ENV=development

# ZhiPu AI settings (recommended)
ZHIPU_API_KEY=your_api_key_here
ZHIPU_VISION_MODEL=glm-4v
ZHIPU_ANALYSIS_MODEL=glm-4

# Tongyi Qianwen settings (alternative)
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_VISION_MODEL=qwen-vl-plus
DASHSCOPE_ANALYSIS_MODEL=qwen-max
```

Run

```bash
python app.py
```

Endpoints

1. **POST `/analyze`** - form field `file` (multipart). Returns JSON:
```json
{
  "is_question": true,
  "subject": "math",
  "question_type": "multiple_choice",
  "question_text": "What is 2 + 2?",
  "options": ["A: 3", "B: 4", "C: 5"],
  "correct_answer": "B",
  "student_answer": "A",
  "is_wrong": true,
  "error_type": "calculation",
  "error_reason": "Incorrect addition",
  "explanation": "2 + 2 equals 4",
  "confidence": 0.95
}
```

2. **POST `/intelligent_analyze`** - form field `file` (multipart). Returns JSON:
```json
{
  "ocr_result": null,
  "llm_analysis": {
    "is_question": true,
    "subject": "math",
    "question_type": "multiple_choice",
    "question_text": "What is 2 + 2?",
    "options": ["A: 3", "B: 4", "C: 5"],
    "correct_answer": "B",
    "student_answer": "A",
    "is_wrong": true,
    "error_type": "calculation",
    "error_reason": "Incorrect addition",
    "explanation": "2 + 2 equals 4",
    "confidence": 0.95
  },
  "llm_source": "glm-4v + glm-4"
}
```

3. **POST `/generate_similar_question`** - JSON body. Returns JSON:
```json
{
  "success": true,
  "similar_question": {
    "question_text": "What is 3 + 3?",
    "options": ["A: 5", "B: 6", "C: 7"],
    "correct_answer": "B",
    "explanation": "3 + 3 equals 6"
  }
}
```

4. **POST `/generate_similar_questions`** - JSON body with `count` parameter. Returns multiple similar questions.

Notes
- The service uses AI vision models for more accurate and intelligent analysis compared to traditional OCR.
- For production use, ensure you have sufficient API credits for your expected usage volume.
- The service includes automatic cleanup of temporary files to manage disk space.
