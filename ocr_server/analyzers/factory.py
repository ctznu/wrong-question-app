from .zhipu_analyzer import ZhipuAnalyzer
from .ollama_analyzer import OllamaAnalyzer
from .tongyi_analyzer import TongyiAnalyzer
from .hunyuan_analyzer import HunyuanAnalyzer


class AnalyzerFactory:
    @staticmethod
    def get_analyzer(analyzer_type: str, **kwargs):
        if analyzer_type == 'zhipu':
            return ZhipuAnalyzer(**kwargs)
        elif analyzer_type == 'ollama':
            return OllamaAnalyzer(**kwargs)
        elif analyzer_type == 'tongyi':
            return TongyiAnalyzer(**kwargs)
        elif analyzer_type == 'hunyuan':
            return HunyuanAnalyzer(**kwargs)
        else:
            return ZhipuAnalyzer(**kwargs)
