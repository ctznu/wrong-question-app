import requests
import json

# 测试API端点
url = 'http://127.0.0.1:5000/analyze'

# 准备测试数据
files = {
    'file': open('ocr_server/debug_uploads/ScreenShot_2026-02-01_150443_514.png', 'rb'),
    'model': (None, 'ollama')
}

try:
    # 发送请求
    response = requests.post(url, files=files)
    
    # 检查响应状态
    if response.status_code == 200:
        # 解析响应
        data = response.json()
        print('API 响应成功:')
        print(f'学科: {data.get("subject")}')
        print(f'题目: {data.get("question", "")[:100]}...')
        print(f'正确答案: {data.get("correctAnswer")}')
        print(f'学生答案: {data.get("studentAnswer")}')
        print(f'是否错误: {data.get("isWrong")}')
        print(f'错误类型: {data.get("errorType")}')
        print(f'错误原因: {data.get("errorReason")}')
        print(f'推理步骤: {data.get("reasoningSteps", "")[:200]}...')
    else:
        print(f'API 响应失败: {response.status_code}')
        print(response.text)
except Exception as e:
    print(f'测试失败: {e}')
finally:
    # 关闭文件
    files['file'].close()
