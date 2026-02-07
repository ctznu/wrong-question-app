"""
API LLM 客户端
支持智谱AI API
折中方案：2次调用（识别+分析）
添加了重试机制来处理API 429错误
"""
import os
from dotenv import load_dotenv
from api_llm import ZhipuLLM, TongyiLLM, HunyuanLLM

load_dotenv()


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
