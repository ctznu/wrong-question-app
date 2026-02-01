"""
Ollama 本地 LLM 客户端
用于智能识别和分析小学错题
"""
import requests
import json
import os
from typing import Optional, Dict, List


class OllamaLLMClient:
    """Ollama 本地 LLM 客户端"""

    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.default_model = os.getenv('OLLAMA_MODEL', 'qwen2.5:14b')
        self.timeout = int(os.getenv('OLLAMA_TIMEOUT', '60'))

    def is_available(self) -> bool:
        """检查 Ollama 服务是否可用"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception:
            return False

    def get_available_models(self) -> List[str]:
        """获取可用模型列表"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                return [m['name'] for m in models]
        except Exception:
            pass
        return []

    def analyze_question(self, ocr_text: str,
                       image_path: Optional[str] = None,
                       model: Optional[str] = None) -> Dict:
        """
        智能分析题目

        Args:
            ocr_text: OCR 识别的文本
            image_path: 图片路径（用于多模态分析）
            model: 指定模型名称

        Returns:
            {
                'is_question': bool,        # 是否是题目
                'subject': str,             # 学科: math/chinese/english/unknown
                'question_text': str,       # 题目内容
                'question_type': str,       # 题目类型
                'options': List[Dict],     # 选项列表
                'correct_answer': str,      # 正确答案
                'difficulty': str,          # 难度: easy/medium/hard
                'student_answer': str,      # 学生答案（如果识别到）
                'student_answer_bbox': Dict,# 学生答案位置
                'is_wrong': bool,          # 学生答案是否错误
                'error_type': str,         # 错误类型
                'error_reason': str,       # 错误原因
                'confidence': float,        # 置信度
                'explanation': str         # 题目解析
            }
        """
        prompt = self._build_analysis_prompt(ocr_text)
        model = model or self.default_model

        try:
            if image_path and os.path.exists(image_path):
                # 多模态: 发送图片
                return self._call_with_image(prompt, image_path, model)
            else:
                # 纯文本分析
                return self._call_text(prompt, model)
        except Exception as e:
            return {
                'error': str(e),
                'confidence': 0.0,
                'is_question': None
            }

    def _build_analysis_prompt(self, ocr_text: str) -> str:
        """构建分析提示词"""
        return f"""你是一个小学错题分析老师，专门帮助小学生理解和纠正错题。请分析以下OCR识别的文字：

{ocr_text}

**重要要求：**
1. 必须忠实地提取图片上的文字，不要修改、补充或猜测题目内容
2. 如果有填空（ ），保持填空的形式，不要自己填写
3. 不要自己发挥，不要添加图片上没有的内容
4. 如果题目不完整（有填空），就保持不完整的状态

请按以下JSON格式输出：
{{
  "is_question": true/false,
  "subject": "math/chinese/english/unknown",
  "question_type": "single_choice/multiple_choice/fill_blank/short_answer/essay",
  "question_text": "题目完整内容（忠实地提取，不要修改）",
  "options": [
    {{"key": "A", "text": "选项A内容"}},
    {{"key": "B", "text": "选项B内容"}},
    {{"key": "C", "text": "选项C内容"}},
    {{"key": "D", "text": "选项D内容"}}
  ],
  "correct_answer": "正确答案",
  "difficulty": "easy/medium/hard",
  "student_answer": "学生填写的答案（如果没有则为空）",
  "student_answer_bbox": {{"x": 0, "y": 0, "width": 0, "height": 0}},
  "is_wrong": true/false,
  "error_type": "calculation/concept/reading/careless/none",
  "error_reason": "错误原因详细分析",
  "confidence": 0.95,
  "explanation": "题目详细解析"
}}

重要指导原则：

1. **题目内容提取要求（非常重要）**：
   - 忠实地提取图片上的文字，不要修改、补充或猜测
   - 对于选择题：question_text 必须包含完整的题干和所有选项（A、B、C、D等）
   - 选项必须完整提取，包括选项标识（A、B、C、D）和选项内容
   - 不要遗漏任何选项，即使选项内容较长
   - 如果有填空（ ），保持填空的形式，不要自己填写

2. **目标学生群体**：这是给小学生看的（1-6年级），请用简单易懂的语言

3. **错误原因分析要求**：
   - 不要用过于抽象或高深的数学概念解释
   - 不要举例小学生还没学过的知识点（比如小数、分数、负数等）
   - 用具体的、生活化的例子说明
   - 简洁明了，一句话说清楚即可

4. **error_type 分类标准**：
   - calculation（计算错误）：加减乘除算错了、进位借位错了、小点点错了等
   - concept（概念不清）：记错公式、理解错意思、混淆相似概念
   - reading（审题错误）：没看清题目、看错数字、答非所问
   - careless（粗心大意）：抄错数字、写错符号、漏写单位等

5. **错误原因示例（参考风格）**：
   - "把加号看成乘号了，看仔细一点哦"
   - "个位进位时算错了，再检查一下"
   - "忘记先算括号里面的了，顺序要记牢"
   - "把题目要求看错了，要读清楚问的是什么"

6. **科目识别**：
   - math（数学）：有数字、计算符号、几何图形、方程等
   - chinese（语文）：有拼音、汉字、词语、古诗、阅读理解等
   - english（英语）：有英文单词、翻译、语法等

7. 其他要求：
   - student_answer_bbox 表示学生答案在图片中的位置（百分比坐标，0-1之间）
   - 如果文字不是题目，设置 is_question 为 false"""

    def _call_text(self, prompt: str, model: str) -> Dict:
        """纯文本调用"""
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,  # 低温度，确定性输出
                "max_tokens": 2000
            }
        }

        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=self.timeout
        )

        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.status_code}")

        result = response.json()
        response_text = result.get('response', '')

        # 解析 JSON 响应
        return self._parse_json_response(response_text)

    def _call_with_image(self, prompt: str, image_path: str, model: str) -> Dict:
        """带图像的多模态调用"""
        # 读取并编码图片
        with open(image_path, 'rb') as f:
            image_data = f.read()

        import base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        payload = {
            "model": model,
            "prompt": prompt,
            "images": [image_base64],
            "stream": False,
            "options": {
                "temperature": 0.1,
                "max_tokens": 2000
            }
        }

        response = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=self.timeout
        )

        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.status_code}")

        result = response.json()
        response_text = result.get('response', '')

        return self._parse_json_response(response_text)

    def _parse_json_response(self, text: str) -> Dict:
        """解析 LLM 返回的 JSON"""
        import re

        # 提取 JSON 块
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            json_str = json_match.group(0)
            try:
                result = json.loads(json_str)
                result['raw_response'] = text
                return result
            except json.JSONDecodeError:
                pass

        # 解析失败，返回默认结构
        return {
            'is_question': None,
            'error': 'Failed to parse LLM response',
            'raw_response': text,
            'confidence': 0.0
        }


# 全局实例
ollama_client = OllamaLLMClient()


def get_available_llm():
    """获取可用的 Ollama 客户端实例"""
    if ollama_client.is_available():
        return ollama_client
    return None
