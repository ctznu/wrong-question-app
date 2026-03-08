from .base import QuestionAnalyzer
from typing import Dict, Optional
from api_llm_client import ZhipuLLM

class ZhipuAnalyzer(QuestionAnalyzer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None, **kwargs) -> Dict:
        grade = kwargs.get('grade', '') or self.grade
        zhipu = ZhipuLLM()
        if not zhipu.is_available():
            return {
                'is_question': False,
                'error': 'No Zhipu API key',
                'message': '请配置智谱AI API密钥以启用智能分析',
                'llm_source': 'zhipu'
            }
        raw_result = zhipu.analyze_question(ocr_text, image_path, grade=grade)
        return self.parse_result(raw_result)
    
    def parse_result(self, raw_result: Dict, ocr_result: Optional[Dict] = None) -> Dict:
        return {
            'is_question': raw_result.get('is_question', False),
            'subject': raw_result.get('subject', 'unknown'),
            'questionType': raw_result.get('question_type', 'unknown'),
            'question': raw_result.get('question_text', ''),
            'options': raw_result.get('options', []),
            'correctAnswer': raw_result.get('correct_answer', ''),
            'difficulty': raw_result.get('difficulty', 'medium'),
            'studentAnswer': raw_result.get('student_answer', ''),
            'studentAnswerBbox': raw_result.get('student_answer_bbox', {}),
            'isWrong': raw_result.get('is_wrong', False),
            'errorType': raw_result.get('error_type', 'none'),
            'errorReason': raw_result.get('error_reason', ''),
            'explanation': raw_result.get('explanation', ''),
            'reasoningSteps': raw_result.get('reasoning_steps', ''),
            'grade': raw_result.get('grade', ''),
            'semester': raw_result.get('semester', ''),
            'confidence': raw_result.get('confidence', 0.95),
            'llm_source': 'zhipu',
            'llm_raw_response': raw_result.get('raw_response', '')[:500] if 'raw_response' in raw_result else '',
            'error': raw_result.get('error')
        }
