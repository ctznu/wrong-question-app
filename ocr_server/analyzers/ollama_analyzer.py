from .base import QuestionAnalyzer
from typing import Dict, Optional
from llm_client import get_available_llm
import os

class OllamaAnalyzer(QuestionAnalyzer):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None, **kwargs) -> Dict:
        grade = kwargs.get('grade', '') or self.grade
        ollama_llm = get_available_llm()
        # 从环境变量中读取模型配置
        model_name = os.getenv('OLLAMA_MODEL', 'qwen3-vl:30b')
        if not ollama_llm:
            return {
                'is_question': False,
                'error': 'Ollama not available',
                'message': f'请确保 Ollama 服务已启动并已下载 {model_name} 模型',
                'llm_source': 'ollama'
            }
        raw_result = ollama_llm.analyze_question(ocr_text, image_path, model=model_name, grade=grade)
        return self.parse_result(raw_result)
    
    def parse_result(self, raw_result: Dict, ocr_result: Optional[Dict] = None) -> Dict:
        # 构建合并结果
        merged = {
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
            'confidence': raw_result.get('confidence', 0.5),
            'llm_source': 'ollama',
            'llm_raw_response': raw_result.get('raw_response', '')[:500] if 'raw_response' in raw_result else '',
            'error': raw_result.get('error')
        }
        
        # 优化：确保返回的字段符合前端期望的格式
        if not merged['questionType']:
            merged['questionType'] = 'short_answer'
        
        if not merged['errorType']:
            merged['errorType'] = 'none'
        
        return merged
