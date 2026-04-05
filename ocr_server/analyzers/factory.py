from .api_analyzers import ZhipuAnalyzer, TongyiAnalyzer, HunyuanAnalyzer, VolcengineAnalyzer
from .ollama_analyzer import OllamaAnalyzer


class AnalyzerFactory:
    _registry = {
        'zhipu': ZhipuAnalyzer,
        'tongyi': TongyiAnalyzer,
        'hunyuan': HunyuanAnalyzer,
        'volcengine': VolcengineAnalyzer,
        'ollama': OllamaAnalyzer,
    }

    @staticmethod
    def get_analyzer(analyzer_type: str, **kwargs):
        cls = AnalyzerFactory._registry.get(analyzer_type, ZhipuAnalyzer)
        return cls(**kwargs)
