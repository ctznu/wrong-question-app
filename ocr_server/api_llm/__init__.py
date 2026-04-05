"""API LLM 模块"""
from .base import BaseAPILM
from .openai_compatible import OpenAICompatibleLLM


class ZhipuLLM(OpenAICompatibleLLM):
    """智谱AI"""
    def __init__(self):
        super().__init__(
            api_key_env='ZHIPU_API_KEY',
            base_url='https://open.bigmodel.cn/api/paas/v4/chat/completions',
            vision_model_env='ZHIPU_VISION_MODEL', vision_model_default='glm-4.6v-flash',
            text_model_env='ZHIPU_TEXT_MODEL', text_model_default='glm-4.7-flash',
            llm_source='zhipu', max_retries=5, retry_delay=3
        )


class TongyiLLM(OpenAICompatibleLLM):
    """通义千问"""
    def __init__(self):
        super().__init__(
            api_key_env='TONGYI_API_KEY',
            base_url='https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            vision_model_env='TONGYI_VISION_MODEL', vision_model_default='qwen-vl-plus',
            text_model_env='TONGYI_ANALYSIS_MODEL', text_model_default='qwen-math-plus',
            llm_source='tongyi'
        )


class HunyuanLLM(OpenAICompatibleLLM):
    """腾讯混元"""
    def __init__(self):
        super().__init__(
            api_key_env='HUNYUAN_API_KEY',
            base_url='https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
            vision_model_env='HUNYUAN_VISION_MODEL', vision_model_default='hunyuan-vision',
            text_model_env='HUNYUAN_ANALYSIS_MODEL', text_model_default='hunyuan-vision',
            llm_source='hunyuan'
        )


class VolcengineLLM(OpenAICompatibleLLM):
    """火山引擎（豆包）"""
    def __init__(self):
        super().__init__(
            api_key_env='VOLCENGINE_API_KEY',
            base_url='https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            vision_model_env='VOLCENGINE_VISION_MODEL', vision_model_default='doubao-seed-1-8-251228',
            text_model_env='VOLCENGINE_TEXT_MODEL', text_model_default='doubao-pro-32k',
            llm_source='volcengine'
        )


__all__ = ['BaseAPILM', 'OpenAICompatibleLLM', 'ZhipuLLM', 'TongyiLLM', 'HunyuanLLM', 'VolcengineLLM']
