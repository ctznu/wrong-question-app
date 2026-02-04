"""
API LLM 客户端
支持智谱AI API
折中方案：2次调用（识别+分析）
添加了重试机制来处理API 429错误
"""
import requests
import json
import os
import base64
import re
import time
from typing import Dict, Optional
from abc import ABC, abstractmethod
from dotenv import load_dotenv

load_dotenv()


class BaseAPILLM(ABC):
    """API LLM 基类"""

    @abstractmethod
    def is_available(self) -> bool:
        """检查是否可用"""
        pass

    @abstractmethod
    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None) -> Dict:
        """分析题目"""
        pass

    @abstractmethod
    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        pass


class ZhipuLLM(BaseAPILLM):
    """智谱AI API"""

    def __init__(self):
        self.api_key = os.getenv('ZHIPU_API_KEY', '')
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.vision_model = os.getenv('ZHIPU_VISION_MODEL', 'glm-4.6v')  # 从配置文件读取模型名称
        self.timeout = int(os.getenv('API_TIMEOUT', '60'))
        self.max_retries = 3  # 最大重试次数
        self.retry_delay = 2  # 初始重试延迟（秒）

    def is_available(self) -> bool:
        return bool(self.api_key)

    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None) -> Dict:
        """分析题目：2次调用（识别+分析）"""
        print(f'[ZhipuLLM] 开始分析...')

        if not image_path:
            raise Exception("需要提供图片路径")

        # 第1次调用：识别图片中的文字
        print(f'[ZhipuLLM] 第1步：识别图片文字...')
        ocr_result = self._recognize_text(image_path)

        # 第2次调用：分析题目和答案
        print(f'[ZhipuLLM] 第2步：分析题目和答案...')
        analysis_result = self._analyze_text(ocr_result)

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
                            "text": "识别图片中的所有文字，区分手写体和印刷体。手写体是学生答案，印刷体是题目。只输出识别到的文字，不做任何推理、补充、添加或修改。绝对不要添加'三角形'、'条'、'个'、'道'等额外词汇。"
                        }
                    ]
                }
            ]
        }

        # 添加重试机制
        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, json=payload,
                                      headers=headers, timeout=self.timeout)

                if response.status_code == 429:
                    # API 速率限制，等待后重试
                    wait_time = self.retry_delay * (2 ** retry)  # 指数退避
                    print(f'[ZhipuLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue

                if response.status_code != 200:
                    error_msg = f"智谱AI API error: {response.status_code}"
                    try:
                        error_detail = response.json()
                        error_msg += f" - {error_detail.get('message', 'Unknown error')}"
                    except:
                        pass
                    raise Exception(error_msg)

                result = response.json()
                content = result['choices'][0]['message']['content']

                print(f'[ZhipuLLM] 识别到的文字: {content[:200]}')
                return content
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[ZhipuLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)

        raise Exception("识别文字失败")

    def _analyze_text(self, ocr_text: str) -> Dict:
        """分析文字"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        payload = {
            "model": f"{self.vision_model}",
            "messages": [
                {
                    "role": "user",
                    "content": self._get_analysis_prompt(ocr_text)
                }
            ]
        }

        # 添加重试机制
        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, json=payload,
                                      headers=headers, timeout=self.timeout)

                if response.status_code == 429:
                    # API 速率限制，等待后重试
                    wait_time = self.retry_delay * (2 ** retry)  # 指数退避
                    print(f'[ZhipuLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue

                if response.status_code != 200:
                    error_msg = f"智谱AI API error: {response.status_code}"
                    try:
                        error_detail = response.json()
                        error_msg += f" - {error_detail.get('message', 'Unknown error')}"
                    except:
                        pass
                    raise Exception(error_msg)

                result = response.json()
                content = result['choices'][0]['message']['content']

                print(f'[ZhipuLLM] 分析响应: {content[:200]}')
                return self._parse_analysis_response(content)
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[ZhipuLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)

        raise Exception("分析文字失败")

    def _get_analysis_prompt(self, ocr_text: str) -> str:
        """获取分析提示词"""
        return f"""分析以下题目内容：

{ocr_text}

任务：
1. 提取完整的题目内容（只包含印刷体，不包含手写体）
   - **保留填空横线**：如果题目中有填空横线（如：______、_____、____），必须保留横线，不要用答案填充
   - **去掉手写答案**：学生写在横线上的答案必须去掉，只保留横线
   - **还原题目本来的样子**：题目应该看起来像原题，包含横线、括号等占位符
   - 括号保持原样，不要填充
2. 提取学生手写答案（只包含手写体，不包含印刷体）
3. **基于题目内容和几何图形推理出正确答案**（仔细分析题目要求，不要直接复制学生答案，要基于几何定义和图形性质推理）
4. 判断学生答案是否正确
5. 如果错误，分析错误原因

输出JSON格式：
{{
  "question_text": "完整题目内容（只包含印刷体，不包含手写体，括号保持原样）",
  "student_answer": "学生答案（只包含手写体，不包含印刷体）",
  "correct_answer": "正确答案（基于题目推理得出）",
  "is_wrong": true/false,
  "error_type": "calculation/concept/reading/careless/none",
  "error_reason": "错误原因",
  "explanation": "题目解析",
  "subject": "math/chinese/english/unknown",
  "difficulty": "easy/medium/hard"
}}

重要要求：
- correct_answer 必须是基于题目内容和几何图形性质推理出来的客观正确答案
- correct_answer 不能受到 student_answer 的影响，必须独立推理
- correct_answer 绝不能等于 student_answer，必须基于题目要求推理
- 如果题目是几何题，要基于几何定义、图形性质和几何规则推理
- 对于三角形类型的判断，要根据三角形的实际性质（如边的长度关系、角的大小等）
- 要确保 correct_answer 的准确性，不要猜测
- 如果学生答案明显错误（如锐角），正确答案应该是等腰三角形，而不是锐角
- **对于英语题目，要特别注意大小写问题**：
  - 专有名词（如人名、地名、星期、月份）首字母大写
  - 普通名词（如 birthday, apple, book）应该小写
  - 句首字母大写，其他小写
  - 如果学生答案中存在大小写错误，必须在 correct_answer 中纠正

只输出JSON。"""

    def _parse_analysis_response(self, text: str) -> Dict:
        """解析分析响应"""
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                result = json.loads(json_match.group(0))
                result['raw_response'] = text
                return result
            except json.JSONDecodeError as e:
                print(f'[ZhipuLLM] JSON解析失败: {e}')

        return {
            'is_question': None,
            'error': 'Parse failed',
            'raw_response': text
        }

    def generate_similar_question(self, question_data: Dict) -> Dict:
        """生成类似题目"""
        print(f'[ZhipuLLM] 生成类似题目...')

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        prompt = self._build_similar_question_prompt(question_data)

        payload = {
            "model": f"{self.vision_model}",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        # 添加重试机制
        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, json=payload,
                                      headers=headers, timeout=self.timeout)

                if response.status_code == 429:
                    # API 速率限制，等待后重试
                    wait_time = self.retry_delay * (2 ** retry)  # 指数退避
                    print(f'[ZhipuLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue

                if response.status_code != 200:
                    raise Exception(f"智谱AI API error: {response.status_code}")

                result = response.json()
                content = result['choices'][0]['message']['content']

                print(f'[ZhipuLLM] 类似题目生成完成')
                return self._parse_similar_question_response(content)
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[ZhipuLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)

        raise Exception("生成类似题目失败")

    def _build_similar_question_prompt(self, question_data: Dict) -> str:
        """构建生成类似题目的提示词"""
        question_text = question_data.get('question_text', '')
        error_type = question_data.get('error_type', '')
        error_reason = question_data.get('error_reason', '')

        return f"""根据以下错题生成一道类似题目：

原题：{question_text}
错误类型：{error_type}
错误原因：{error_reason}

要求：
1. 难度和原题相当
2. 针对错误原因设计
3. 数字适当变化
4. 确保计算正确

输出JSON格式：
{{
  "question_text": "新题目内容",
  "correct_answer": "正确答案",
  "explanation": "解题思路（50字以内）"
}}

只输出JSON。"""

    def _parse_similar_question_response(self, text: str) -> Dict:
        """解析类似题目响应"""
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
    """获取可用的 API LLM 实例"""
    zhipu = ZhipuLLM()
    print(f'[get_available_api_llm] 智谱AI 可用: {zhipu.is_available()}')
    if zhipu.is_available():
        print(f'[get_available_api_llm] 使用智谱AI')
        return zhipu

    print(f'[get_available_api_llm] 没有可用的 LLM')
    return None


# 兼容性：保留旧的方法名
class TongyiLLM(ZhipuLLM):
    """兼容性类，继承自 ZhipuLLM"""
    pass
