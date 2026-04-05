"""API LLM 基类"""
import requests
import json
import time
from abc import ABC, abstractmethod
from typing import Dict, Optional


class BaseAPILM(ABC):
    """API LLM 基类，实现公共功能"""
    
    def __init__(self):
        self.timeout = 60
        self.max_retries = 3
        self.retry_delay = 2
    
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
    
    def _make_request(self, url: str, headers: Dict, data: Dict) -> Dict:
        """发起请求，包含重试机制"""
        for retry in range(self.max_retries):
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    json=data,
                    timeout=self.timeout
                )
                
                if response.status_code == 429:
                    # API 速率限制，等待后重试
                    wait_time = self.retry_delay * (2 ** retry)  # 指数退避
                    print(f'[{self.__class__.__name__}] API 速率限制 (429)，{wait_time}秒后重试...')
                    time.sleep(wait_time)
                    continue
                
                if response.status_code == 401:
                    # 未授权错误，可能是API密钥问题
                    error_msg = f"{self.__class__.__name__} API error: 401 Unauthorized - 请检查API密钥是否正确"
                    raise Exception(error_msg)
                
                if response.status_code == 403:
                    # 禁止访问错误，可能是API密钥权限不足
                    error_msg = f"{self.__class__.__name__} API error: 403 Forbidden - 请检查API密钥权限"
                    raise Exception(error_msg)
                
                if response.status_code != 200:
                    error_msg = f"{self.__class__.__name__} API error: {response.status_code}"
                    try:
                        error_detail = response.json()
                        error_msg += f" - {error_detail}"
                    except:
                        error_msg += f" - {response.text[:500]}"
                    raise Exception(error_msg)
                
                return response.json()
            except Exception as e:
                if retry == self.max_retries - 1:
                    raise
                print(f'[{self.__class__.__name__}] 调用失败 (重试 {retry+1}/{self.max_retries}): {e}')
                # 增加基础延迟时间，避免过快重试
                time.sleep(self.retry_delay * (retry + 1))
        
        raise Exception("请求失败")
    
    def _calculate_math_answer(self, reasoning_steps: str) -> str:
        """从推理步骤中提取并计算数学答案"""
        import re
        
        # 查找所有计算步骤
        lines = reasoning_steps.split('\n')
        calculation_lines = []
        
        for line in lines:
            line = line.strip()
            # 查找包含计算的行，如 "165×5=825"
            if '=' in line:
                # 提取等号前后的内容
                parts = line.split('=')
                if len(parts) > 1:
                    # 提取计算表达式（等号前的部分）
                    expr = parts[0].strip()
                    # 清理表达式，移除中文描述
                    expr = re.sub(r'[\u4e00-\u9fa5]+[:：]\s*', '', expr)
                    # 替换中文运算符为Python支持的运算符
                    expr = expr.replace('×', '*').replace('÷', '/')
                    # 验证是否为有效的数学表达式
                    if re.search(r'[0-9]+[+\-*/][0-9]+', expr):
                        calculation_lines.append((expr, parts[1].strip()))
        
        # 如果有计算步骤，尝试计算最后一步
        if calculation_lines:
            last_expr, last_result = calculation_lines[-1]
            try:
                # 安全计算表达式
                # 使用eval计算，但只允许数字和基本运算符
                # 验证表达式只包含允许的字符
                if re.match(r'^[0-9+\-*/\(\)\s]+$', last_expr):
                    calculated_result = str(eval(last_expr))
                    print(f'[BaseAPILM] 计算表达式: {last_expr} = {calculated_result}')
                    return calculated_result
            except Exception as e:
                print(f'[BaseAPILM] 计算失败: {e}')
                # 计算失败，返回最后一步的结果
                return last_result
        
        return None

    def _parse_json_response(self, text: str) -> Dict:
        """解析 JSON 响应"""
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
                
                # 使用数学工具验证和修正正确答案
                if 'reasoning_steps' in result and 'correct_answer' in result:
                    # 从推理步骤中提取并计算数学答案
                    calculated_answer = self._calculate_math_answer(result['reasoning_steps'])
                    if calculated_answer:
                        # 更新correct_answer字段
                        result['correct_answer'] = calculated_answer
                        print(f'[BaseAPILM] 使用数学工具修正正确答案: {calculated_answer}')
                
                return result
            except json.JSONDecodeError:
                # 尝试清理 JSON 字符串
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
    
    def _get_recognize_prompt(self) -> str:
        """获取文字识别提示词"""
        return "请仔细识别图片中的所有文字，包括题目、选项、学生答案等。区分手写体和印刷体，手写体是学生答案，印刷体是题目。\n\n重要要求：\n1. 只输出识别到的文字内容\n2. 不要添加任何说明、解释或推理\n3. 不要包含任何前缀或后缀\n4. 保持原文的格式和顺序\n5. 如果没有识别到文字，就返回空字符串"""
