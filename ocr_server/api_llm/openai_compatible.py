"""OpenAI 兼容的 LLM 基类"""
import os
import base64
import re
import json
from typing import Dict, Optional
from .base import BaseAPILM
from .prompts import get_generic_analysis_prompt, get_similar_question_prompt


class OpenAICompatibleLLM(BaseAPILM):
    """基于 OpenAI 兼容接口的 LLM 基类
    
    所有兼容 OpenAI 格式的 LLM（智谱、混元、通义、火山引擎）
    只需配置 base_url、api_key、model 即可使用，无需重复实现请求逻辑。
    """

    def __init__(self, *, api_key_env: str, base_url: str,
                 vision_model_env: str, vision_model_default: str,
                 text_model_env: str, text_model_default: str,
                 llm_source: str, max_retries: int = 3, retry_delay: int = 2):
        super().__init__()
        self.api_key = os.getenv(api_key_env, '')
        self.base_url = base_url
        self.vision_model = os.getenv(vision_model_env, vision_model_default)
        self.text_model = os.getenv(text_model_env, text_model_default)
        self.llm_source = llm_source
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def is_available(self) -> bool:
        return bool(self.api_key)

    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None, grade: str = '') -> Dict:
        """分析题目：直接看图输出结构化JSON"""
        print(f'[{self.llm_source}] 开始分析...')
        print(f'[{self.llm_source}] 学生年级: {grade}')
        if not image_path:
            raise Exception("需要提供图片路径")
        print(f'[{self.llm_source}] 一步到位分析：使用模型 {self.vision_model}...')
        result = self._call_vision(image_path, grade)
        print(f'[{self.llm_source}] 分析完成')
        return result

    def _call_vision(self, image_path: str, grade: str = '') -> Dict:
        with open(image_path, 'rb') as f:
            image_base64 = base64.b64encode(f.read()).decode('utf-8')

        prompt = get_generic_analysis_prompt(grade=grade)
        payload = self._build_vision_payload(image_base64, prompt)
        result = self._make_request(self.base_url, self._headers(), payload)
        content = result['choices'][0]['message']['content']
        print(f'[{self.llm_source}] 分析响应: {content}')
        return self._parse_content(content)

    def _build_vision_payload(self, image_base64: str, prompt: str) -> Dict:
        return {
            "model": self.vision_model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                    {"type": "text", "text": prompt}
                ]
            }]
        }

    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        print(f'[{self.llm_source}] 生成类似题目...')
        prompt = get_similar_question_prompt(
            question_data.get('question_text', ''),
            question_data.get('error_type', ''),
            question_data.get('error_reason', ''),
            question_data.get('grade', '')
        )
        payload = {"model": self.text_model, "messages": [{"role": "user", "content": prompt}]}
        result = self._make_request(self.base_url, self._headers(), payload)
        content = result['choices'][0]['message']['content']
        print(f'[{self.llm_source}] 类似题目生成完成')
        return self._parse_content(content)

    def _parse_content(self, content: str) -> Dict:
        content = content.strip()
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:].strip()
        parsed = self._parse_json_response(content)
        if 'error' not in parsed:
            return parsed
        try:
            json_str = re.search(r'\{[\s\S]*\}', content, re.DOTALL).group()
            cleaned = re.sub(r'"(?:[^"\\]|\\.)*"', lambda m: m.group(0).replace('\n', '\\n').replace('\r', '\\r'), json_str)
            return self._parse_json_response(cleaned)
        except Exception:
            pass
        return {'question_text': '', 'error': 'Parse failed', 'raw_response': content}

    def _headers(self) -> Dict:
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def parse_result(self, raw_result: Dict, ocr_result: Optional[Dict] = None) -> Dict:
        subject = raw_result.get('subject', 'unknown')
        subject_map = {'数学': 'math', 'math': 'math', '语文': 'chinese', 'chinese': 'chinese', '英语': 'english', 'english': 'english'}
        subject = subject_map.get(subject, 'unknown')
        error_type = raw_result.get('error_type', 'none')
        if error_type not in {'calculation', 'concept', 'reading', 'careless', 'none'}:
            error_type = 'concept'
        return {
            'is_question': raw_result.get('is_question', False),
            'subject': subject,
            'questionType': raw_result.get('question_type', 'unknown'),
            'question': raw_result.get('question_text', ''),
            'options': raw_result.get('options', []),
            'correctAnswer': raw_result.get('correct_answer', ''),
            'difficulty': raw_result.get('difficulty', 'medium'),
            'studentAnswer': raw_result.get('student_answer', ''),
            'studentAnswerBbox': raw_result.get('student_answer_bbox', {}),
            'isWrong': raw_result.get('is_wrong', False),
            'errorType': error_type,
            'errorReason': raw_result.get('error_reason', ''),
            'explanation': raw_result.get('explanation', ''),
            'reasoningSteps': raw_result.get('reasoning_steps', ''),
            'grade': raw_result.get('grade', ''),
            'semester': raw_result.get('semester', ''),
            'confidence': raw_result.get('confidence', 0.95),
            'llm_source': self.llm_source,
            'llm_raw_response': raw_result.get('raw_response', '')[:500] if 'raw_response' in raw_result else '',
            'error': raw_result.get('error')
        }
