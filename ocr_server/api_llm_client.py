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


class QuestionAnalyzer(ABC):
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


class ZhipuLLM(QuestionAnalyzer):
    """智谱AI API"""

    def __init__(self):
        self.api_key = os.getenv('ZHIPU_API_KEY', '')
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.vision_model = os.getenv('ZHIPU_VISION_MODEL', 'glm-4.6v')  # 第1步：识别图片文字的模型
        self.analysis_model = os.getenv('ZHIPU_ANALYSIS_MODEL', 'glm-4.7-flash')  # 第2步：分析题目和答案的模型
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
        print(f'[ZhipuLLM] 第2步：分析题目和答案，使用模型 {self.analysis_model}...')
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
            "model": f"{self.analysis_model}",
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

**重要：必须从以下4个错误类型中选择一个：**
- **calculation（计算错误）**：加减乘除算错了、进位借位错了、小数点点错了、抄错数字、写错符号等
- **concept（概念不清）**：记错公式、理解错意思、混淆相似概念、用错公式等
- **reading（审题错误）**：没看清题目、看错数字、答非所问、漏看条件、理解错题意等
- **careless（粗心大意）**：漏写单位、漏写答案、写错位置、忘记做题、抄错题目等
- **none（无错误）**：学生答案正确，没有错误

输出JSON格式：
{{
  "question_text": "完整题目内容（只包含印刷体，不包含手写体，括号保持原样）",
  "student_answer": "学生答案（只包含手写体，不包含印刷体）",
  "correct_answer": "正确答案（基于题目推理得出）",
  "is_wrong": true/false,
  "error_type": "calculation/concept/reading/careless/none",
  "error_reason": "错误原因",
  "explanation": "题目解析",
  "reasoning_steps": "推理步骤（分步骤展示如何从题目推导出正确答案）",
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
                return {
                    'is_question': result.get('is_question', False),
                    'subject': result.get('subject', 'unknown'),
                    'questionType': result.get('question_type', 'unknown'),
                    'question': result.get('question_text', ''),
                    'options': result.get('options', []),
                    'correctAnswer': result.get('correct_answer', ''),
                    'difficulty': result.get('difficulty', 'medium'),
                    'studentAnswer': result.get('student_answer', ''),
                    'studentAnswerBbox': result.get('student_answer_bbox', {}),
                    'isWrong': result.get('is_wrong', False),
                    'errorType': result.get('error_type', 'none'),
                    'errorReason': result.get('error_reason', ''),
                    'explanation': result.get('explanation', ''),
                    'reasoningSteps': result.get('reasoning_steps', ''),
                    'grade': result.get('grade', ''),
                    'semester': result.get('semester', ''),
                    'confidence': result.get('confidence', 0.95)
                }
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
            "model": f"{self.analysis_model}",
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


class TongyiLLM(QuestionAnalyzer):
    """通义千问 API"""

    def __init__(self):
        self.api_key = os.getenv('TONGYI_API_KEY', '')
        self.base_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
        self.model = os.getenv('TONGYI_MODEL', 'qwen-vl-max')
        self.vision_model = self.model
        self.analysis_model = self.model
        self.timeout = int(os.getenv('API_TIMEOUT', '60'))
        self.max_retries = 3
        self.retry_delay = 2

    def is_available(self) -> bool:
        return bool(self.api_key)

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

        data = {
            'model': self.vision_model,
            'input': {
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'image', 'image': f'data:image/jpeg;base64,{image_base64}'},
                            {'type': 'text', 'text': prompt}
                        ]
                    }
                ]
            }
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
                    raise Exception(f"通义千问 API error: {response.status_code}")

                result = response.json()
                content = result.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content', [{}])[0].get('text', '')
                
                print(f'[TongyiLLM] 识别到的文字: {content[:200]}')
                return content
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[TongyiLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)
        
        raise Exception("识别文字失败")

    def _analyze_text(self, ocr_text: str) -> Dict:
        """分析题目和答案"""
        prompt = self._build_analysis_prompt(ocr_text)

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        data = {
            'model': self.analysis_model,
            'input': {
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': prompt}
                        ]
                    }
                ]
            }
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
                    raise Exception(f"通义千问 API error: {response.status_code}")

                result = response.json()
                content = result.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content', [{}])[0].get('text', '')
                
                print(f'[TongyiLLM] API 原始响应: {content[:500]}')
                
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
                        print(f'[TongyiLLM] 解析成功: {parsed}')
                        return parsed
                    except json.JSONDecodeError as e:
                        print(f'[TongyiLLM] JSON 解析失败: {e}')
                        print(f'[TongyiLLM] JSON 内容: {json_match.group()}')
                        return {
                            'raw_response': content,
                            'error': f'JSON 解析失败: {str(e)}'
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

    def _build_analysis_prompt(self, ocr_text: str) -> str:
        """构建分析提示词"""
        return f"""请分析以下题目内容，返回 JSON 格式：

{ocr_text}

要求：
1. 识别学科（chinese/math/english）
2. 识别题目类型（single_choice/short_answer）
3. 提取题目内容
4. 提取选项（如果有）
5. 判断正确答案
6. 识别学生答案
7. 判断是否错误
8. 分析错误类型（计算错误/概念不清/审题错误/粗心大意）
9. 提供错误原因
10. 提供详细解析
11. 提供推理步骤
12. 识别年级和学期

输出JSON格式：
{{
  "is_question": true,
  "subject": "math",
  "question_type": "single_choice",
  "question_text": "题目内容",
  "options": [{{"key": "A", "text": "选项内容"}}],
  "correct_answer": "正确答案",
  "student_answer": "学生答案",
  "is_wrong": true,
  "error_type": "计算错误",
  "error_reason": "错误原因",
  "explanation": "详细解析",
  "reasoning_steps": "推理步骤",
  "difficulty": "medium",
  "confidence": 0.95,
  "grade": "3",
  "semester": "1"
}}
只输出JSON，不要其他内容。"""

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

        prompt = self._build_similar_prompt(question_data)

        data = {
            'model': self.model,
            'input': {
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            }
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
                    raise Exception(f"通义千问 API error: {response.status_code}")

                result = response.json()
                content = result.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content', [{}])[0].get('text', '')

                json_match = re.search(r'\{[^{}]*\}', content)
                if json_match:
                    parsed = json.loads(json_match.group())
                    parsed['raw_response'] = content
                    return parsed

                return {
                    'question_text': '',
                    'error': 'Parse failed',
                    'raw_response': content
                }

            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[TongyiLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)

        raise Exception("生成类似题目失败")

    def _build_similar_prompt(self, question_data: Dict) -> str:
        """构建提示词"""
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


class HunyuanLLM(QuestionAnalyzer):
    """腾讯混元 API"""

    def __init__(self):
        self.api_key = os.getenv('HUNYUAN_API_KEY', '')
        self.base_url = "https://api.hunyuan.cloud.tencent.com/v1/chat/completions"
        self.vision_model = os.getenv('HUNYUAN_VISION_MODEL', 'hunyuan-vision')
        self.analysis_model = os.getenv('HUNYUAN_ANALYSIS_MODEL', 'hunyuan-pro')
        self.timeout = int(os.getenv('API_TIMEOUT', '60'))
        self.max_retries = 3
        self.retry_delay = 2

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
                            "text": "识别图片中的所有文字，区分手写体和印刷体。手写体是学生答案，印刷体是题目。只输出识别到的文字，不做任何推理、补充、添加或修改。绝对不要添加'三角形'、'条'、'个'、'道'等额外词汇。"
                        }
                    ]
                }
            ]
        }

        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, json=payload,
                                      headers=headers, timeout=self.timeout)
                
                if response.status_code == 429:
                    wait_time = self.retry_delay * (2 ** retry)
                    print(f'[HunyuanLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue
                
                if response.status_code != 200:
                    error_msg = f"腾讯混元 API error: {response.status_code}"
                    try:
                        error_detail = response.json()
                        error_msg += f" - {error_detail.get('message', 'Unknown error')}"
                    except:
                        pass
                    raise Exception(error_msg)
                
                result = response.json()
                content = result['choices'][0]['message']['content']
                print(f'[HunyuanLLM] 识别到的文字: {content[:200]}')
                return content
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[HunyuanLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)
        
        raise Exception("识别文字失败")

    def _analyze_text(self, ocr_text: str) -> Dict:
        """分析题目和答案"""
        prompt = self._build_analysis_prompt(ocr_text)

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

        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, json=payload,
                                      headers=headers, timeout=self.timeout)
                
                if response.status_code == 429:
                    wait_time = self.retry_delay * (2 ** retry)
                    print(f'[HunyuanLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue
                
                if response.status_code != 200:
                    raise Exception(f"腾讯混元 API error: {response.status_code}")
                
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                print(f'[HunyuanLLM] API 原始响应: {content[:500]}')
                
                content = content.strip()
                if content.startswith('```'):
                    content = content.split('```')[1]
                    if content.startswith('json'):
                        content = content[4:].strip()
                
                json_match = re.search(r'\{[\s\S]*\}', content, re.DOTALL)
                if json_match:
                    try:
                        json_str = json_match.group()
                        parsed = json.loads(json_str)
                        parsed['raw_response'] = content
                        print(f'[HunyuanLLM] 解析成功: {parsed}')
                        return parsed
                    except json.JSONDecodeError as e:
                        print(f'[HunyuanLLM] JSON解析失败: {e}')
                        print(f'[HunyuanLLM] 尝试清理 JSON 字符串...')
                        try:
                            json_str = self._clean_json_string(json_str)
                            parsed = json.loads(json_str)
                            parsed['raw_response'] = content
                            print(f'[HunyuanLLM] 清理后解析成功')
                            return parsed
                        except json.JSONDecodeError as e2:
                            print(f'[HunyuanLLM] 清理后仍然解析失败: {e2}')
                
                return {
                    'question_text': '',
                    'error': 'Parse failed',
                    'raw_response': content
                }
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[HunyuanLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)
        
        raise Exception("分析题目失败")

    def _build_analysis_prompt(self, ocr_text: str) -> str:
        """构建分析提示词"""
        return f"""请分析以下题目内容，返回 JSON 格式：

{ocr_text}

要求：
1. 识别学科（chinese/math/english）
2. 识别题目类型（single_choice/short_answer）
3. 提取题目内容
4. 提取选项（如果有）
5. 判断正确答案
6. 识别学生答案
7. 判断是否错误
8. 分析错误类型（计算错误/概念不清/审题错误/粗心大意）
9. 提供错误原因
10. 提供详细解析
11. 提供推理步骤
12. 识别年级和学期

输出JSON格式：
{{
  "is_question": true,
  "subject": "math",
  "question_type": "single_choice",
  "question_text": "题目内容",
  "options": [{{"key": "A", "text": "选项内容"}}],
  "correct_answer": "正确答案",
  "student_answer": "学生答案",
  "is_wrong": true,
  "error_type": "计算错误",
  "error_reason": "错误原因",
  "explanation": "详细解析",
  "reasoning_steps": "推理步骤",
  "difficulty": "medium",
  "confidence": 0.95,
  "grade": "3",
  "semester": "1"
}}
只输出JSON，不要其他内容。"""

    def _clean_json_string(self, json_str: str) -> str:
        """清理 JSON 字符串中的无效字符"""
        import re
        
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
        
        prompt = self._build_similar_prompt(question_data)
        
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
        
        for retry in range(self.max_retries):
            try:
                response = requests.post(self.base_url, json=payload,
                                      headers=headers, timeout=self.timeout)
                
                if response.status_code == 429:
                    wait_time = self.retry_delay * (2 ** retry)
                    print(f'[HunyuanLLM] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue
                
                if response.status_code != 200:
                    raise Exception(f"腾讯混元 API error: {response.status_code}")
                
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                json_match = re.search(r'\{[^{}]*\}', content)
                if json_match:
                    parsed = json.loads(json_match.group())
                    parsed['raw_response'] = content
                    return parsed
                
                return {
                    'question_text': '',
                    'error': 'Parse failed',
                    'raw_response': content
                }
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[HunyuanLLM] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                time.sleep(self.retry_delay)
        
        raise Exception("生成类似题目失败")

    def _build_similar_prompt(self, question_data: Dict) -> str:
        """构建提示词"""
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


def get_available_api_llm():
    """获取可用的 API LLM 实例"""

    default_llm = os.getenv('DEFAULT_LLM', 'zhipu').lower()
    print(f'[get_available_api_llm] 默认 LLM: {default_llm}')

    zhipu = ZhipuLLM()
    tongyi = TongyiLLM()
    hunyuan = HunyuanLLM()

    zhipu_available = zhipu.is_available()
    tongyi_available = tongyi.is_available()
    hunyuan_available = hunyuan.is_available()

    print(f'[get_available_api_llm] 智谱AI 可用: {zhipu_available}')
    print(f'[get_available_api_llm] 通义千问 可用: {tongyi_available}')
    print(f'[get_available_api_llm] 腾讯混元 可用: {hunyuan_available}')

    if default_llm == 'tongyi' and tongyi_available:
        print(f'[get_available_api_llm] 使用通义千问（默认配置）')
        return tongyi
    elif default_llm == 'zhipu' and zhipu_available:
        print(f'[get_available_api_llm] 使用智谱AI（默认配置）')
        return zhipu
    elif default_llm == 'hunyuan' and hunyuan_available:
        print(f'[get_available_api_llm] 使用腾讯混元（默认配置）')
        return hunyuan

    if zhipu_available:
        print(f'[get_available_api_llm] 使用智谱AI（备选）')
        return zhipu
    if tongyi_available:
        print(f'[get_available_api_llm] 使用通义千问（备选）')
        return tongyi
    if hunyuan_available:
        print(f'[get_available_api_llm] 使用腾讯混元（备选）')
        return hunyuan

    print(f'[get_available_api_llm] 没有可用的 LLM')
    return None
