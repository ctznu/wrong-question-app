"""智谱AI API 客户端"""
import os
import base64
from typing import Dict, Optional
from .base import BaseAPILM
from .prompts import get_generic_analysis_prompt, get_similar_question_prompt


class ZhipuLLM(BaseAPILM):
    """智谱AI API"""

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('ZHIPU_API_KEY', '')
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.vision_model = os.getenv('ZHIPU_VISION_MODEL', 'glm-4.6v-flash')  # 第1步：识别图片文字的模型
        self.analysis_model = os.getenv('ZHIPU_ANALYSIS_MODEL', 'glm-4.7-flash')  # 第2步：分析题目和答案的模型
        # 增强重试机制配置
        self.max_retries = 5  # 增加最大重试次数
        self.retry_delay = 3  # 增加初始重试延迟

    def is_available(self) -> bool:
        return bool(self.api_key)

    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None, grade: str = '') -> Dict:
        """分析题目：2次调用（识别+分析）"""
        print(f'[ZhipuLLM] 开始分析...')
        print(f'[ZhipuLLM] 学生年级: {grade}')

        if not image_path:
            raise Exception("需要提供图片路径")

        # 第1次调用：识别图片中的文字
        print(f'[ZhipuLLM] 第1步：识别图片文字...')
        ocr_result = self._recognize_text(image_path)

        # 添加延迟，减少请求密度，避免429错误
        import time
        time.sleep(2)  # 2秒延迟
        print(f'[ZhipuLLM] 等待2秒后进行第2步分析...')

        # 第2次调用：分析题目和答案
        print(f'[ZhipuLLM] 第2步：分析题目和答案，使用模型 {self.analysis_model}...')
        analysis_result = self._analyze_text(ocr_result, grade=grade)

        # 合并结果
        result = {**analysis_result, 'ocr_text': ocr_result}
        print(f'[ZhipuLLM] 分析完成')
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
            "model": f"{self.vision_model}",
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

        print(f'[ZhipuLLM] 识别到的文字: {content[:200]}')
        return content

    def _analyze_text(self, ocr_text: str, grade: str = '') -> Dict:
        """分析文字"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        prompt = get_generic_analysis_prompt(ocr_text, grade=grade)
        
        payload = {
            "model": f"{self.analysis_model}",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        result = self._make_request(self.base_url, headers, payload)
        content = result['choices'][0]['message']['content']

        print(f'[ZhipuLLM] 分析响应: {content[:200]}')
        return self._parse_json_response(content)

    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        print(f'[ZhipuLLM] 生成类似题目...')

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        question_text = question_data.get('question_text', '')
        error_type = question_data.get('error_type', '')
        error_reason = question_data.get('error_reason', '')
        grade = question_data.get('grade', '')
        prompt = get_similar_question_prompt(question_text, error_type, error_reason, grade)

        payload = {
            "model": f"{self.analysis_model}",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        result = self._make_request(self.base_url, headers, payload)
        content = result['choices'][0]['message']['content']

        print(f'[ZhipuLLM] 类似题目生成完成')
        return self._parse_json_response(content)
