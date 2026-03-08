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

    def __init__(self, base_url: Optional[str] = None):
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
                       model: Optional[str] = None,
                       grade: str = '') -> Dict:
        """
        智能分析题目

        Args:
            ocr_text: OCR 识别的文本
            image_path: 图片路径（用于多模态分析）
            model: 指定模型名称
            grade: 学生年级

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
        prompt = self._build_analysis_prompt(ocr_text, grade=grade)
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

    def _build_analysis_prompt(self, ocr_text: str, grade: str = '') -> str:
        """构建分析提示词 - 方案A：恢复核心规则"""
        grade_info = ""
        if grade:
            grade_labels = {
                '1': '一年级', '2': '二年级', '3': '三年级',
                '4': '四年级', '5': '五年级', '6': '六年级'
            }
            grade_label = grade_labels.get(str(grade), f'{grade}年级')
            grade_info = f"\n**学生年级**：{grade_label}"
        
        return f"""你是一位经验丰富的小学教师，正在分析学生的错题。{grade_info}

**OCR识别的文字：**
{ocr_text}

**核心任务：**
1. 区分印刷体（题目）和手写体（学生答案）
   - 黑色手写体是学生答案，红色手写体是老师订正（忽略）
   - 保留题目中的括号、横线等占位符
2. 独立推理出正确答案（不受学生答案影响）
3. 分析学生答案的错误原因

**输出格式（JSON）：**
{{
  "is_question": true/false,
  "subject": "math/chinese/english/unknown",
  "question_text": "题目内容（只含印刷体，括号横线保持原样）",
  "question_type": "single_choice/multiple_choice/fill_blank/short_answer/essay",
  "options": [{{"key": "A", "text": "选项内容"}}],
  "correct_answer": "正确答案（你独立推理得出）",
  "difficulty": "easy/medium/hard",
  "student_answer": "学生答案（只含黑色手写体）",
  "student_answer_bbox": {{"x": 0, "y": 0, "width": 0, "height": 0}},
  "is_wrong": true/false,
  "error_type": "calculation/concept/reading/careless/none",
  "error_reason": "用小学生能懂的话解释错在哪",
  "confidence": 0.95,
  "explanation": "解题思路"
}}

**错误类型：**
- calculation: 计算过程出错
- concept: 概念理解错误  
- reading: 审题理解错误（如"2个30相乘"理解成2×30）
- careless: 粗心大意
- none: 答案正确

**重要提醒：**
- "几个几相乘/相加"要正确理解题意
- 正确答案必须独立推理
- 学生答案只识别黑色手写体
- student_answer_bbox 表示学生答案位置（百分比坐标0-1）

只输出JSON。"""

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

        # 清理文本，去除可能的前缀和后缀
        text = text.strip()
        
        # 处理可能的代码块格式
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        
        # 提取 JSON 块
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            json_str = json_match.group(0)
            try:
                result = json.loads(json_str)
                result['raw_response'] = text
                return result
            except json.JSONDecodeError:
                # 尝试清理 JSON 字符串，去除可能的无效字符
                json_str = json_str.replace('\n', ' ').replace('\r', ' ')
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
