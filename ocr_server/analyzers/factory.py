from .zhipu_analyzer import ZhipuAnalyzer
from .ollama_analyzer import OllamaAnalyzer
from .tongyi_analyzer import TongyiAnalyzer
from .hunyuan_analyzer import HunyuanAnalyzer


class AnalyzerFactory:
    @staticmethod
    def get_analyzer(analyzer_type: str):
        if analyzer_type == 'zhipu':
            return ZhipuAnalyzer()
        elif analyzer_type == 'ollama':
            return OllamaAnalyzer()
        elif analyzer_type == 'tongyi':
            return TongyiAnalyzer()
        elif analyzer_type == 'hunyuan':
            return HunyuanAnalyzer()
        else:
            return ZhipuAnalyzer()
