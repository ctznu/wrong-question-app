from .base import QuestionAnalyzer
from typing import Dict, Optional
from api_llm_client import ZhipuLLM, TongyiLLM, HunyuanLLM, VolcengineLLM


class _BaseAPIAnalyzer(QuestionAnalyzer):
    """API LLM 分析器基类，消除重复代码"""
    llm_cls = None

    def analyze_question(self, ocr_text: str, image_path: Optional[str] = None, **kwargs) -> Dict:
        grade = kwargs.get('grade', '') or self.grade
        llm = self.llm_cls()
        if not llm.is_available():
            return {
                'is_question': False,
                'error': 'No API key',
                'message': f'请配置 {self.llm_cls.__name__} API 密钥',
                'llm_source': llm.llm_source
            }
        raw_result = llm.analyze_question(ocr_text, image_path, grade=grade)
        return llm.parse_result(raw_result)

    def parse_result(self, raw_result: Dict, ocr_result: Optional[Dict] = None) -> Dict:
        llm = self.llm_cls()
        return llm.parse_result(raw_result)


class ZhipuAnalyzer(_BaseAPIAnalyzer):
    llm_cls = ZhipuLLM


class TongyiAnalyzer(_BaseAPIAnalyzer):
    llm_cls = TongyiLLM


class HunyuanAnalyzer(_BaseAPIAnalyzer):
    llm_cls = HunyuanLLM


class VolcengineAnalyzer(_BaseAPIAnalyzer):
    llm_cls = VolcengineLLM
