"""通义千问 API 客户端"""
import requests
import json
import os
import base64
import re
import time
from typing import Dict, Optional
from .base import BaseAPILM
from .prompts import get_generic_analysis_prompt, get_similar_question_prompt


class TongyiLLM(BaseAPILM):
    """通义千问 API"""

    def __init__(self):
        super().__init__()
        self.api_key = os.getenv('TONGYI_API_KEY', '')
        # 通义千问 API 端点
        self.base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        self.vision_model = os.getenv('TONGYI_VISION_MODEL', 'qwen-vl-plus')
        self.analysis_model = os.getenv('TONGYI_ANALYSIS_MODEL', 'qwen-plus')

    def is_available(self) -> bool:
        return bool(self.api_key)
    
    def _get_recognize_prompt(self) -> str:
        """获取文字识别提示词"""
        return "请识别图片中的所有文字，包括题目、选项、答案等。\n\n只输出识别到的文字内容，不要添加任何其他内容。\n\n如果没有识别到文字，就返回空字符串。"""

    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None) -> Dict:
        """分析题目：2次调用（识别+分析）"""
        print(f'[TongyiLLM] 开始分析...')

        if not image_path:
            raise Exception("需要提供图片路径")

        # 第1次调用：识别图片中的文字
        print(f'[TongyiLLM] 第1步：识别图片文字...')
        ocr_result = self._recognize_text(image_path)

        # 第2次调用：分析题目和答案
        print(f'[TongyiLLM] 第2步：分析题目和答案，使用模型 {self.analysis_model}...')
        analysis_result = self._analyze_text(ocr_result)

        # 合并结果
        result = {**analysis_result, 'ocr_text': ocr_result}
        print(f'[TongyiLLM] 分析完成')
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

        prompt = "识别图片中的所有文字，区分手写体和印刷体。手写体是学生答案，印刷体是题目。只输出识别到的文字，不做任何推理、补充、添加或修改。绝对不要添加'三角形'、'条'、'个'、'道'等额外词汇。"

        # 通义千问兼容模式 API 格式（OpenAI 兼容格式）
        data = {
            'model': self.vision_model,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': f'data:image/jpeg;base64,{image_base64}'
                            }
                        },
                        {
                            'type': 'text',
                            'text': prompt
                        }
                    ]
                }
            ]
        }

        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, headers=headers, json=data, timeout=self.timeout)

                if response.status_code == 429:
                    wait_time = self.retry_delay * (2 ** retry)
                    print(f'[TongyiLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue

                if response.status_code != 200:
                    error_detail = ''
                    try:
                        error_data = response.json()
                        error_detail = f" - {error_data.get('message', str(error_data))}"
                    except:
                        error_detail = f" - {response.text[:200]}"
                    raise Exception(f"通义千问 API error: {response.status_code}{error_detail}")

                result = response.json()
                # 通义千问兼容模式响应格式：choices[0].message.content
                content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                
                print(f'[TongyiLLM] 识别到的文字：{content[:200]}')
                return content
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[TongyiLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)
        
        raise Exception("识别文字失败")
    
    def _analyze_image(self, image_path: str) -> Dict:
        """直接分析图片中的题目"""
        with open(image_path, 'rb') as f:
            image_data = f.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        # 使用更加明确的提示词
        prompt = "请仔细分析图片中的题目，包括题目内容、选项、学生答案等。\n\n请按照以下 JSON 格式返回分析结果：\n{\n  \"is_question\": true,\n  \"subject\": \"math\",\n  \"question_type\": \"multiple_choice\",\n  \"question_text\": \"题目内容\",\n  \"options\": [{\"key\": \"A\", \"text\": \"选项A\"}],\n  \"correct_answer\": \"A\",\n  \"student_answer\": \"B\",\n  \"is_wrong\": true,\n  \"error_type\": \"calculation\",\n  \"error_reason\": \"计算错误\",\n  \"explanation\": \"详细解析\",\n  \"difficulty\": \"medium\",\n  \"confidence\": 0.95\n}\n\n重要要求：\n1. 只输出 JSON 格式的结果\n2. 不要添加任何前缀或后缀\n3. 确保 JSON 格式正确\n4. 尽量详细地分析题目"

        data = {
            'model': self.vision_model,
            'input': {
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            },
            'parameters': {
                'images': [f'data:image/jpeg;base64,{image_base64}']
            }
        }

        result = self._make_request(self.base_url, headers, data)
        
        # 尝试从不同的响应结构中获取内容
        content = result.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content', '')
        
        # 处理 content 可能是列表的情况
        text_content = ''
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get('type') == 'text':
                    text_content += item.get('text', '')
        elif isinstance(content, dict) and content.get('type') == 'text':
            text_content = content.get('text', '')
        else:
            text_content = str(content)
        
        # 只显示 API 原始响应的前100个字符，避免日志过长
        print('[TongyiLLM] API 原始响应:', text_content[:500])
        
        # 如果没有返回内容，返回默认错误
        if not text_content or text_content.strip() == '':
            return {
                'is_question': False,
                'error': 'No content returned from API',
                'message': '通义千问没有返回分析结果，请尝试使用其他大模型',
                'llm_source': 'tongyi'
            }
        
        text_content = text_content.strip()
        if text_content.startswith('```'):
            text_content = text_content.split('```')[1]
            if text_content.startswith('json'):
                text_content = text_content[4:].strip()
        
        json_match = self._parse_json_response(text_content)
        if 'error' not in json_match:
            return json_match
        
        return {
            'is_question': False,
            'error': 'Failed to parse JSON response',
            'message': '无法解析通义千问的响应，请尝试使用其他大模型',
            'llm_source': 'tongyi',
            'raw_response': text_content
        }

    def _analyze_text(self, ocr_text: str) -> Dict:
        """分析题目和答案"""
        prompt = get_generic_analysis_prompt(ocr_text)

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        # 通义千问兼容模式 API 格式（OpenAI 兼容格式）
        data = {
            'model': self.analysis_model,
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ]
        }

        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, headers=headers, json=data, timeout=self.timeout)

                if response.status_code == 429:
                    wait_time = self.retry_delay * (2 ** retry)
                    print(f'[TongyiLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue

                if response.status_code != 200:
                    error_detail = ''
                    try:
                        error_data = response.json()
                        error_detail = f" - {error_data.get('message', str(error_data))}"
                    except:
                        error_detail = f" - {response.text[:200]}"
                    raise Exception(f"通义千问 API error: {response.status_code}{error_detail}")

                result = response.json()
                # 通义千问兼容模式响应格式：choices[0].message.content
                content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                
                print(f'[TongyiLLM] API 原始响应：{content[:500]}')
                
                content = content.strip()
                if content.startswith('```'):
                    content = content.split('```')[1]
                    if content.startswith('json'):
                        content = content[4:].strip()
                
                json_match = re.search(r'\{[\s\S]*\}', content, re.DOTALL)
                if json_match:
                    try:
                        parsed = json.loads(json_match.group())
                        parsed['raw_response'] = content
                        print(f'[TongyiLLM] 解析成功：{parsed}')
                        return parsed
                    except json.JSONDecodeError as e:
                        print(f'[TongyiLLM] JSON 解析失败：{e}')
                        print(f'[TongyiLLM] JSON 内容：{json_match.group()}')
                        return {
                            'raw_response': content,
                            'error': f'JSON 解析失败：{str(e)}'
                        }
                
                return {
                    'raw_response': content,
                    'error': 'Failed to parse JSON response'
                }
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[TongyiLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)
        
        raise Exception("分析题目失败")

    def parse_result(self, raw_result: Dict) -> Dict:
        """解析结果"""
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
            'errorType': raw_result.get('error_type') or 'none',
            'errorReason': raw_result.get('error_reason') or '',
            'explanation': raw_result.get('explanation', ''),
            'reasoningSteps': raw_result.get('reasoning_steps', ''),
            'grade': raw_result.get('grade', ''),
            'semester': raw_result.get('semester', ''),
            'confidence': raw_result.get('confidence', 0.95),
            'llm_source': 'tongyi',
            'llm_raw_response': raw_result.get('raw_response', '')[:500] if 'raw_response' in raw_result else '',
            'error': raw_result.get('error')
        }

    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        print(f'[TongyiLLM] 生成类似题目...')

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        question_text = question_data.get('question_text', '')
        error_type = question_data.get('error_type', '')
        error_reason = question_data.get('error_reason', '')
        grade = question_data.get('grade', '')
        prompt = get_similar_question_prompt(question_text, error_type, error_reason, grade)

        # 通义千问兼容模式 API 格式
        data = {
            'model': self.analysis_model,
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ]
        }

        result = self._make_request(self.base_url, headers, data)
        # 通义千问兼容模式响应格式：choices[0].message.content
        content = result.get('choices', [{}])[0].get('message', {}).get('content', '')

        json_match = self._parse_json_response(content)
        if 'error' not in json_match:
            return json_match

        return {
            'question_text': '',
            'error': 'Parse failed',
            'raw_response': content
        }
