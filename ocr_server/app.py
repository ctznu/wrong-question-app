from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import re
import traceback
import os
import requests
import json
from typing import Dict
from dotenv import load_dotenv

from analyzers.factory import AnalyzerFactory

# 加载环境变量
load_dotenv()

# LLM 客户端导入（仅云LLM）
from api_llm_client import get_available_api_llm

app = Flask(__name__)
CORS(app)

# Backend API endpoint
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5001/api')

def infer_subject_from_text(text: str) -> str:
    """从文本中推断学科"""
    if not text:
        return 'unknown'

    # 数学关键词
    math_keywords = ['计算', '方程', '面积', '体积', '长度', 'x=', '+', '-', '*', '/', '×', '÷', '答案']
    # 语文关键词
    chinese_keywords = ['拼音', '汉字', '造句', '阅读', '诗词', '成语', '解释', '理解']
    # 英语关键词
    english_keywords = ['translate', 'english', 'english', 'spell', 'english:']

    lower_text = text.lower()

    if any(kw in lower_text for kw in math_keywords):
        return 'math'
    elif any(kw in lower_text for kw in chinese_keywords):
        return 'chinese'
    elif any(kw in lower_text for kw in english_keywords):
        return 'english'

    return 'unknown'

# ========== 智能识别端点 ==========

@app.route('/intelligent_analyze', methods=['POST'])
def intelligent_analyze():
    """
    智能识别端点
    使用智谱AI进行视觉识别和题目分析
    """
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400

    f = request.files['file']

    try:
        # 1. 保存文件
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug_uploads')
        os.makedirs(debug_dir, exist_ok=True)
        saved_path = os.path.join(debug_dir, f.filename)
        f.stream.seek(0)
        with open(saved_path, 'wb') as out_f:
            out_f.write(f.stream.read())

        # 直接使用智谱AI视觉模型进行智能分析（不需要 Tesseract OCR）
        result = {
            'ocr_result': None,  # 不再使用 Tesseract
            'llm_analysis': None,
            'llm_source': None,
            'error': None
        }

        print('[intelligent_analyze] 尝试使用可用 API LLM...')
        api_llm = get_available_api_llm()
        if api_llm:
            try:
                vision_model = getattr(api_llm, 'vision_model', 'unknown')
                analysis_model = getattr(api_llm, 'analysis_model', 'unknown')
                print(f'[intelligent_analyze] 开始调用 {vision_model}...')
                llm_result = api_llm.analyze_question('', saved_path)
                result['llm_analysis'] = llm_result
                result['llm_source'] = f'{vision_model} + {analysis_model}'
                print(f'[intelligent_analyze] {vision_model} + {analysis_model} 分析成功')
            except Exception as e:
                tb = traceback.format_exc()
                vision_model = getattr(api_llm, 'vision_model', 'unknown')
                analysis_model = getattr(api_llm, 'analysis_model', 'unknown')
                print(f'[intelligent_analyze] {vision_model} + {analysis_model} 失败: {e}')
                print(f'[intelligent_analyze] 错误详情:\n{tb}')
                result['error'] = f'API LLM failed: {str(e)}'
        else:
            result['llm_analysis'] = {
                'is_question': None,
                'error': 'No cloud LLM available',
                'message': '请配置智谱AI或通义千问 API密钥以启用智能分析'
            }
            result['llm_source'] = 'none'

        # 5. 格式化返回结果（将 LLM 分析结果转换为前端需要的格式）
        llm_analysis = result['llm_analysis']
        print(f'[intelligent_analyze] llm_analysis 内容: {llm_analysis}')
        if llm_analysis:
            formatted_result = {
                'is_question': llm_analysis.get('is_question', False),
                'subject': llm_analysis.get('subject', 'unknown'),
                'questionType': llm_analysis.get('question_type', 'unknown'),
                'question': llm_analysis.get('question_text', ''),
                'options': llm_analysis.get('options', []),
                'correctAnswer': llm_analysis.get('correct_answer', ''),
                'difficulty': llm_analysis.get('difficulty', 'medium'),
                'studentAnswer': llm_analysis.get('student_answer', ''),
                'studentAnswerBbox': llm_analysis.get('student_answer_bbox', {}),
                'isWrong': llm_analysis.get('is_wrong', False),
                'errorType': llm_analysis.get('error_type', 'none'),
                'errorReason': llm_analysis.get('error_reason', ''),
                'explanation': llm_analysis.get('explanation', ''),
                'reasoningSteps': llm_analysis.get('reasoning_steps', ''),
                'grade': llm_analysis.get('grade', ''),
                'semester': llm_analysis.get('semester', ''),
                'confidence': llm_analysis.get('confidence', 0.95),
                'llm_source': result['llm_source'],
                'llm_raw_response': llm_analysis.get('raw_response', '')[:500] if 'raw_response' in llm_analysis else '',
                'error': result.get('error')
            }
        else:
            formatted_result = {
                'is_question': False,
                'subject': 'unknown',
                'questionType': 'unknown',
                'question': '',
                'options': [],
                'correctAnswer': '',
                'difficulty': 'medium',
                'studentAnswer': '',
                'studentAnswerBbox': {},
                'isWrong': False,
                'errorType': 'none',
                'errorReason': '',
                'explanation': '',
                'grade': '',
                'semester': '',
                'confidence': 0.0,
                'llm_source': result['llm_source'],
                'llm_raw_response': '',
                'error': result.get('error')
            }

        return jsonify(formatted_result)

    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({'error': str(e), 'traceback': tb}), 500


@app.route('/generate_similar_question', methods=['POST'])
def generate_similar_question():
    """
    生成类似题目端点
    根据学生的错误类型，生成针对性的练习题
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'no data provided'}), 400

        question_data = {
            'question_text': data.get('question', ''),
            'student_answer': data.get('studentAnswer', ''),
            'correct_answer': data.get('correctAnswer', ''),
            'error_type': data.get('errorType', 'none'),
            'error_reason': data.get('errorReason', ''),
            'subject': data.get('subject', 'unknown'),
            'question_type': data.get('questionType', 'short_answer')
        }

        print(f'[generate_similar_question] 生成类似题目: {question_data["question_text"][:50]}...')

        api_llm = get_available_api_llm()
        if not api_llm:
            return jsonify({
                'error': 'No cloud LLM available',
                'message': '请配置云LLM API密钥（智谱AI）以启用智能分析'
            }), 400

        similar_question = api_llm.generate_similar_question(question_data)

        print(f'[generate_similar_question] 生成成功')

        return jsonify({
            'success': True,
            'similar_question': similar_question
        })

    except Exception as e:
        tb = traceback.format_exc()
        print(f'[generate_similar_question] 错误: {e}')
        print(f'[generate_similar_question] 错误详情:\n{tb}')
        return jsonify({'error': str(e), 'traceback': tb}), 500


@app.route('/generate_similar_questions', methods=['POST'])
def generate_similar_questions():
    """
    批量生成类似题目端点
    根据学生的错误类型，一次性生成多道针对性的练习题
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'no data provided'}), 400

        count = data.get('count', 1)
        if count < 1 or count > 10:
            return jsonify({'error': 'count must be between 1 and 10'}), 400

        question_data = {
            'question_text': data.get('question', ''),
            'student_answer': data.get('studentAnswer', ''),
            'correct_answer': data.get('correctAnswer', ''),
            'error_type': data.get('errorType', 'none'),
            'error_reason': data.get('errorReason', ''),
            'subject': data.get('subject', 'unknown'),
            'question_type': data.get('questionType', 'short_answer')
        }

        print(f'[generate_similar_questions] 批量生成 {count} 道类似题目: {question_data["question_text"][:50]}...')

        api_llm = get_available_api_llm()
        if not api_llm:
            return jsonify({
                'error': 'No cloud LLM available',
                'message': '请配置云LLM API密钥（智谱AI）以启用智能分析'
            }), 400

        similar_questions = []
        for i in range(count):
            print(f'[generate_similar_questions] 生成第 {i+1}/{count} 道题目...')
            similar_question = api_llm.generate_similar_question(question_data)
            similar_questions.append(similar_question)

        print(f'[generate_similar_questions] 批量生成成功，共 {len(similar_questions)} 道题目')

        return jsonify({
            'success': True,
            'similar_questions': similar_questions
        })

    except Exception as e:
        tb = traceback.format_exc()
        print(f'[generate_similar_questions] 错误: {e}')
        print(f'[generate_similar_questions] 错误详情:\n{tb}')
        return jsonify({'error': str(e), 'traceback': tb}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400

    f = request.files['file']
    analyzer_type = request.form.get('model', 'zhipu')

    try:
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug_uploads')
        os.makedirs(debug_dir, exist_ok=True)
        saved_path = os.path.join(debug_dir, f.filename)
        f.stream.seek(0)
        with open(saved_path, 'wb') as out_f:
            out_f.write(f.stream.read())

        analyzer = AnalyzerFactory.get_analyzer(analyzer_type)
        result = analyzer.analyze_question('', saved_path)

        return jsonify(result)
    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({'error': str(e), 'traceback': tb}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
