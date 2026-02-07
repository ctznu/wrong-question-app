"""腾讯混元 API 客户端"""
import os
import base64
import re
from typing import Dict, Optional
from .base import BaseAPILM
from .prompts import get_generic_analysis_prompt, get_similar_question_prompt


class HunyuanLLM(BaseAPILM):
    """腾讯混元 API"""

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('HUNYUAN_API_KEY', '')
        self.base_url = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions"
        self.vision_model = os.getenv('HUNYUAN_VISION_MODEL', 'hunyuan-vision')
        self.analysis_model = os.getenv('HUNYUAN_ANALYSIS_MODEL', 'hunyuan-pro')

    def is_available(self) -> bool:
        return bool(self.api_key)

    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None) -> Dict:
        """分析题目：2次调用（识别+分析）"""
        print(f'[HunyuanLLM] 开始分析...')

        if not image_path:
            raise Exception("需要提供图片路径")

        # 第1次调用：识别图片中的文字
        print(f'[HunyuanLLM] 第1步：识别图片文字...')
        ocr_result = self._recognize_text(image_path)

        # 第2次调用：分析题目和答案
        print(f'[HunyuanLLM] 第2步：分析题目和答案，使用模型 {self.analysis_model}...')
        analysis_result = self._analyze_text(ocr_result)

        # 合并结果
        result = {**analysis_result, 'ocr_text': ocr_result}
        print(f'[HunyuanLLM] 分析完成')
        return result

    def _recognize_text(self, image_path: str) -> str:
        """识别图片中的文字"""
        with open(image_path, 'rb') as f:
            image_data = f.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        payload = {
            "model": self.vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": self._get_recognize_prompt()
                        }
                    ]
                }
            ]
        }

        result = self._make_request(self.base_url, headers, payload)
        content = result['choices'][0]['message']['content']
        print(f'[HunyuanLLM] 识别到的文字: {content[:200]}')
        return content

    def _analyze_text(self, ocr_text: str) -> Dict:
        """分析题目和答案"""
        prompt = get_generic_analysis_prompt(ocr_text)

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        payload = {
            "model": self.analysis_model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        result = self._make_request(self.base_url, headers, payload)
        content = result['choices'][0]['message']['content']
        
        print('[HunyuanLLM] API 原始响应:', content[:500])
        
        content = content.strip()
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:].strip()
        
        json_match = self._parse_json_response(content)
        if 'error' not in json_match:
            return json_match
        
        # 尝试清理 JSON 字符串
        try:
            json_str = re.search(r'\{[\s\S]*\}', content, re.DOTALL).group()
            cleaned_json = self._clean_json_string(json_str)
            cleaned_match = self._parse_json_response(cleaned_json)
            if 'error' not in cleaned_match:
                return cleaned_match
        except:
            pass
        
        return {
            'question_text': '',
            'error': 'Parse failed',
            'raw_response': content
        }

    def _clean_json_string(self, json_str: str) -> str:
        """清理 JSON 字符串中的无效字符"""
        def replace_newlines_in_strings(match):
            text = match.group(0)
            if text.startswith('"'):
                return text.replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
            return text
        
        result = re.sub(r'"(?:[^"\\]|\\.)*"', replace_newlines_in_strings, json_str)
        return result

    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        print(f'[HunyuanLLM] 生成类似题目...')
        
        question_text = question_data.get('question_text', '')
        error_type = question_data.get('error_type', '')
        error_reason = question_data.get('error_reason', '')
        prompt = get_similar_question_prompt(question_text, error_type, error_reason)
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            "model": self.analysis_model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        result = self._make_request(self.base_url, headers, payload)
        content = result['choices'][0]['message']['content']
        
        json_match = self._parse_json_response(content)
        if 'error' not in json_match:
            return json_match
        
        return {
            'question_text': '',
            'error': 'Parse failed',
            'raw_response': content
        }
