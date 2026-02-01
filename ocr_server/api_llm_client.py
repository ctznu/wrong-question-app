"""
API LLM 客户端
支持通义千问 API
"""
import requests
import json
import os
from typing import Dict, Optional
from abc import ABC, abstractmethod
from dotenv import load_dotenv


class BaseAPILLM(ABC):
    """API LLM 基类"""

    @abstractmethod
    def is_available(self) -> bool:
        """检查是否可用"""
        pass

    @abstractmethod
    def analyze_question(self, ocr_text: str,
                       image_path: Optional[str] = None) -> Dict:
        """分析题目"""
        pass

    @abstractmethod
    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        pass


class TongyiLLM(BaseAPILLM):
    """通义千问 API"""

    def __init__(self):
        self.api_key = os.getenv('TONGYI_API_KEY', '')
        self.vision_base_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
        self.reasoning_base_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
        self.timeout = int(os.getenv('API_TIMEOUT', '60'))

    def is_available(self) -> bool:
        return bool(self.api_key)

    def extract_text_from_image(self, image_path: str) -> str:
        """使用视觉模型从图片中提取文字"""
        print(f'[TongyiLLM] 使用 qwen-vl-max 提取文字...')
        
        if not image_path:
            raise Exception("需要提供图片路径")
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        # 读取并编码图片
        import base64
        with open(image_path, 'rb') as f:
            image_data = f.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        payload = {
            "model": "qwen-vl-max",
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "image": f"data:image/jpeg;base64,{image_base64}"
                            },
                            {
                                "text": "请提取这张图片中的所有文字，特别注意：1. 只识别图片中实际存在的文字，不要推断或猜测任何内容 2. 特别注意识别学生的手写答案（可能写在括号里、横线上、空白处）3. 不要填充或修改括号里的内容 4. 不要添加任何分析或解释。只输出识别到的文字。"
                            }
                        ]
                    }
                ]
            }
        }

        response = requests.post(self.vision_base_url, json=payload,
                              headers=headers, timeout=self.timeout)

        if response.status_code != 200:
            error_msg = f"通义千问 API error: {response.status_code}"
            try:
                error_detail = response.json()
                error_msg += f" - {error_detail.get('message', 'Unknown error')}"
            except:
                pass
            raise Exception(error_msg)

        result = response.json()
        content = result['output']['choices'][0]['message']['content']
        if isinstance(content, list):
            response_text = content[0]['text'] if content else ''
        elif isinstance(content, str):
            response_text = content
        else:
            response_text = str(content)
        
        print(f'[TongyiLLM] 提取的文字: {response_text}')
        print(f'[TongyiLLM] 文字提取完成')
        return response_text

    def analyze_question(self, ocr_text: str,
                       image_path: Optional[str] = None) -> Dict:
        """分析题目 - 使用两步流程"""
        print(f'[TongyiLLM] 开始分析...')
        
        if image_path:
            # 第一步：用视觉模型提取文字
            extracted_text = self.extract_text_from_image(image_path)
            print(f'[TongyiLLM] 提取的文字: {extracted_text[:200] if extracted_text else "(空)"}')
        else:
            extracted_text = ocr_text
        
        # 第二步：用文本模型分析文字并输出 JSON
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        prompt = self._build_prompt(extracted_text)

        payload = {
            "model": "qwen-max",
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
        }

        response = requests.post(self.reasoning_base_url, json=payload,
                              headers=headers, timeout=self.timeout)

        if response.status_code != 200:
            error_msg = f"通义千问 API error: {response.status_code}"
            try:
                error_detail = response.json()
                error_msg += f" - {error_detail.get('message', 'Unknown error')}"
            except:
                pass
            raise Exception(error_msg)

        result = response.json()
        response_text = result['output']['text']

        print(f'[TongyiLLM] 分析完成')
        return self._parse_response(response_text)

    def _build_prompt(self, ocr_text: str) -> str:
        """构建提示词"""
        return f"""分析以下小学题目，输出JSON格式：

题目内容：
{ocr_text}

重要说明：
1. question_text：输出完整的题目内容，包括括号，括号里保持为空
2. student_answer：从图片中识别学生的手写答案或选择（括号里、横线上、空白处、选项前的标记等），不要自己推断或猜测
3. correct_answer：根据题目内容推断的正确答案
4. 如果图片中有学生选择了某个选项（如 A、B、C、D），提取出来作为 student_answer
5. 如果图片中没有学生答案，student_answer 留空

输出JSON格式：
{{
  "is_question": true,
  "subject": "math/chinese/english/unknown",
  "question_type": "single_choice/multiple_choice/fill_blank/short_answer/essay",
  "question_text": "题目内容（必须完整，包括题干、括号和所有选项）",
  "options": [{{"key": "A", "text": "选项A"}}, ...],
  "correct_answer": "正确答案（根据题目推断）",
  "difficulty": "easy/medium/hard",
  "student_answer": "学生答案（从图片中识别，不要推断）",
  "student_answer_bbox": {{"x": 0, "y": 0, "width": 0, "height": 0}},
  "is_wrong": true/false,
  "error_type": "calculation/concept/reading/careless/none",
  "error_reason": "错误原因",
  "explanation": "题目解析",
  "grade": "1/2/3/4/5/6",
  "semester": "上/下"
}}

只输出JSON，不要添加任何其他文字。"""

    def _parse_response(self, text: str) -> Dict:
        """解析响应"""
        import re
        print(f'[TongyiLLM] 待解析的文本: {text[:500] if text else "(空)"}')
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                result['raw_response'] = text
                print(f'[TongyiLLM] 解析成功: {result}')
                return result
            except json.JSONDecodeError as e:
                print(f'[TongyiLLM] JSON 解析失败: {e}')
                pass
        print(f'[TongyiLLM] 未找到 JSON')
        return {
            'is_question': None,
            'error': 'Parse failed',
            'raw_response': text,
            'confidence': 0.0
        }

    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目 - 使用 qwen-max"""
        print(f'[TongyiLLM] 使用 qwen-max 生成类似题目...')
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        prompt = self._build_similar_question_prompt(question_data)

        payload = {
            "model": "qwen-max",
            "input": {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
        }

        response = requests.post(self.reasoning_base_url, json=payload,
                              headers=headers, timeout=self.timeout)

        if response.status_code != 200:
            raise Exception(f"通义千问推理模型 API error: {response.status_code}")

        result = response.json()
        response_text = result['output']['text']

        print(f'[TongyiLLM] 类似题目生成完成')
        return self._parse_similar_question(response_text)

    def _build_similar_question_prompt(self, question_data: Dict) -> str:
        """构建生成类似题目的提示词"""
        question_text = question_data.get('question_text', '')
        error_type = question_data.get('error_type', '')
        error_reason = question_data.get('error_reason', '')
        student_answer = question_data.get('student_answer', '')
        correct_answer = question_data.get('correct_answer', '')
        subject = question_data.get('subject', 'unknown')
        question_type = question_data.get('question_type', '')

        return f"""你是一个小学数学老师，专门为学生生成针对性的练习题。

## 原题信息
题目内容：{question_text}
学生答案：{student_answer}
正确答案：{correct_answer}
错误类型：{error_type}
错误原因：{error_reason}
科目：{subject}
题目类型：{question_type}

## 任务要求
请根据学生的错误原因，生成一道类似的练习题，帮助学生巩固这个知识点。

## 重要原则

1. **针对性**：
   - 如果学生是计算错误，生成一道需要仔细计算的题目
   - 如果学生是概念不清，生成一道考察相同概念的题目
   - 如果学生是审题错误，生成一道容易看错的题目
   - 如果学生是粗心大意，生成一道需要仔细检查的题目

2. **贴近原题**：
   - 难度要和原题相当
   - 题型要和原题相同
   - 知识点要和原题一致
   - 数字要适当变化，不要完全一样

3. **适合小学生**：
   - 题目要简单易懂
   - 不要使用小学生没学过的知识点
   - 数字要合理，不要太复杂

## 输出格式（JSON）
{{
  "question_text": "新题目内容",
  "options": [{{"key": "A", "text": "选项A"}}, ...],
  "correct_answer": "正确答案",
  "explanation": "解题思路（简洁明了，不超过50字）",
  "target_error": "这道题针对的错误类型",
  "practice_point": "这道题练习的知识点"
}}

重要要求：
- explanation（解题思路）必须简洁明了，不超过50字
- 不要长篇大论，用一句话概括解题要点即可

请只输出JSON，不要其他内容。"""

    def _parse_similar_question(self, text: str) -> Dict:
        """解析类似题目响应"""
        import re
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                result['raw_response'] = text
                return result
            except json.JSONDecodeError:
                pass
        return {
            'question_text': '',
            'error': 'Parse failed',
            'raw_response': text
        }


def get_available_api_llm():
    """获取可用的 API LLM 实例，按优先级排序"""
    # 只使用通义千问
    tongyi = TongyiLLM()
    print(f'[get_available_api_llm] 通义千问 可用: {tongyi.is_available()}')
    if tongyi.is_available():
        print(f'[get_available_api_llm] 使用通义千问')
        return tongyi

    print(f'[get_available_api_llm] 没有可用的 LLM')
    return None
