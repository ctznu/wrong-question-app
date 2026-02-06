from .base import QuestionAnalyzer
from typing import Dict, Optional
from llm_client import get_available_llm
from ocr_utils import perform_ocr

class OllamaAnalyzer(QuestionAnalyzer):
    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None) -> Dict:
        ocr_result = perform_ocr(image_path)
        ollama_llm = get_available_llm()
        if not ollama_llm:
            return {
                'is_question': False,
                'error': 'Ollama not available',
                'message': '请确保 Ollama 服务已启动并已下载 deepseek-r1:8b 模型',
                'llm_source': 'ollama'
            }
        raw_result = ollama_llm.analyze_question(ocr_text, image_path, model='deepseek-r1:8b')
        return self.parse_result(raw_result, ocr_result)
    
    def parse_result(self, raw_result: Dict, ocr_result: Optional[Dict] = None) -> Dict:
        merged = {
            'ocr_text': ocr_result.get('text', '') if ocr_result else '',
            'ocr_words': ocr_result.get('words', []) if ocr_result else [],
            'ocr_blocks': ocr_result.get('blocks', []) if ocr_result else [],
            'is_question': raw_result.get('is_question', False),
            'subject': raw_result.get('subject', 'unknown'),
            'questionType': raw_result.get('question_type', 'short_answer'),
            'question': raw_result.get('question_text', ''),
            'options': raw_result.get('options', []),
            'correctAnswer': raw_result.get('correct_answer', ''),
            'explanation': raw_result.get('explanation', ''),
            'difficulty': raw_result.get('difficulty', 'medium'),
            'studentAnswer': raw_result.get('student_answer', ''),
            'studentAnswerBbox': raw_result.get('student_answer_bbox', {}),
            'isWrong': raw_result.get('is_wrong', False),
            'errorType': raw_result.get('error_type', 'none'),
            'errorReason': raw_result.get('error_reason', ''),
            'reasoningSteps': raw_result.get('reasoning_steps', ''),
            'grade': raw_result.get('grade', ''),
            'semester': raw_result.get('semester', ''),
            'confidence': raw_result.get('confidence', ocr_result.get('confidence', 0.5) if ocr_result else 0.5),
            'llm_source': 'ollama',
            'llm_raw_response': raw_result.get('raw_response', '')[:500] if 'raw_response' in raw_result else '',
            'error': raw_result.get('error')
        }
        return merged
