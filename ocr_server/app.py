from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import cv2
import numpy as np
import pytesseract
from pytesseract import Output
import io
import re
import traceback
import os
import shutil
import subprocess
import requests
import json
from typing import Dict
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# LLM 客户端导入（仅云LLM）
from api_llm_client import get_available_api_llm
from llm_client import get_available_llm

# Try to locate tesseract executable and set pytesseract path if found
def locate_tesseract():
    # first try system PATH
    exe = shutil.which('tesseract')
    if exe:
        return exe
    # common Windows locations
    candidates = [
        r'C:\ProgramData\chocolatey\bin\tesseract.exe',
        r'C:\ProgramData\chocolatey\lib\tesseract.portable\tools\tesseract.exe',
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None

tess_cmd = locate_tesseract()
if tess_cmd:
    pytesseract.pytesseract.tesseract_cmd = tess_cmd
    print(f'[ocr_server] Using tesseract executable: {tess_cmd}')
else:
    print('[ocr_server] WARNING: tesseract executable not found in PATH or common locations')

# discover installed tesseract languages
def get_installed_languages():
    try:
        out = subprocess.run([pytesseract.pytesseract.tesseract_cmd, '--list-langs'], capture_output=True, text=True, check=True)
        # output may contain header lines; language codes follow
        lines = [l.strip() for l in out.stdout.splitlines() if l.strip()]
        # tesseract prints first line like 'List of available languages (x):'
        langs = []
        for l in lines:
            if l.lower().startswith('list of'):
                continue
            # languages may be space separated or one per line
            parts = l.split()
            for p in parts:
                if p:
                    langs.append(p)
        return langs
    except Exception as e:
        print('[ocr_server] Could not list tesseract languages:', e)
        return []

AVAILABLE_LANGS = get_installed_languages()
print(f'[ocr_server] Installed tesseract languages: {AVAILABLE_LANGS}')

app = Flask(__name__)
CORS(app)

# Backend API endpoint
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5001/api')

def build_blocks_from_words(words, line_threshold=10):
    """Group words into text lines/blocks based on vertical position"""
    if not words:
        return []
    
    # Sort words by vertical position
    sorted_words = sorted(words, key=lambda w: w['top'])
    
    blocks = []
    current_line_top = sorted_words[0]['top']
    current_line = {'text': '', 'bbox': {'left': float('inf'), 'top': current_line_top, 'width': 0, 'height': 0}, 'words': []}
    
    for word in sorted_words:
        # Check if word belongs to current line
        if abs(word['top'] - current_line_top) < line_threshold:
            # Add to current line
            if current_line['text']:
                current_line['text'] += ' '
            current_line['text'] += word['text']
            current_line['words'].append(word)
            
            # Update bbox
            current_line['bbox']['left'] = min(current_line['bbox']['left'], word['left'])
            current_line['bbox']['width'] = max(current_line['bbox']['width'], word['left'] + word['width']) - current_line['bbox']['left']
            current_line['bbox']['height'] = max(current_line['bbox']['height'], word['top'] + word['height']) - current_line['bbox']['top']
        else:
            # Save previous line and start new one
            if current_line['words']:  # Only add if line has words
                blocks.append(current_line)
            
            current_line_top = word['top']
            current_line = {
                'text': word['text'],
                'bbox': {'left': word['left'], 'top': word['top'], 'width': word['width'], 'height': word['height']},
                'words': [word]
            }
    
    # Add last line
    if current_line['words']:
        blocks.append(current_line)
    
    return blocks

def parse_text(text):
    def find(pattern):
        m = re.search(pattern, text)
        return m.group(1).strip() if m else ''

    parsed = {
        'text': text,
        'question': find(r'题目[：:](.*?)(\n|$)'),
        'correctAnswer': find(r'正确答案[：:](.*?)(\n|$)'),
        'wrongAnswer': find(r'错误答案[：:](.*?)(\n|$)'),
        'reason': find(r'错误原因[：:](.*?)(\n|$)'),
        'tags': find(r'标签[：:](.*?)(\n|$)')
    }

    # 如果没有识别到错误答案，就不显示错误原因
    if not parsed.get('wrongAnswer'):
        parsed['reason'] = ''

    # extract options / choices (A/B/C/D) from lines
    options = []
    # pattern 1: lines like 'A. text' or 'A) text' or 'A、text'
    for m in re.finditer(r'(?m)^[ \t]*([A-D])\s*[\.|\)|、|．|：|:]\s*(.+)$', text):
        options.append({'key': m.group(1), 'text': m.group(2).strip()})

    # pattern 2: lines like '(A) text' or '（A）text'
    if not options:
        for m in re.finditer(r'(?m)^[ \t]*[\(（]?([A-D])[\)）]\s*(.+)$', text):
            options.append({'key': m.group(1), 'text': m.group(2).strip()})

    # pattern 3: numbered choices or one-per-line without labels (fallback)
    if not options:
        # look for lines that look like short option candidates (length limit)
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        candidates = [l for l in lines if 1 < len(l) < 120 and (len(l.split()) < 20)]
        # if we have 2-6 short lines after '选项' or '选' keyword, treat as options
        for i, line in enumerate(lines):
            if re.search(r'选项|选', line):
                for j in range(i+1, min(i+6, len(lines))):
                    candidates.append(lines[j])
                break
        if candidates and len(candidates) <= 6 and len(candidates) >= 2:
            for idx, c in enumerate(candidates[:6]):
                options.append({'key': chr(ord('A')+idx), 'text': c})

    parsed['options'] = options

    # try to normalize correctAnswer (could be letter or full text)
    ca = parsed.get('correctAnswer', '')
    if ca:
        ca = ca.strip()
        # if it's a letter like 'A' or 'B', keep; if it's 'A,B' choose first
        m = re.match(r'^[\(（]?[A-D][\)）]?', ca)
        if m:
            parsed['correctAnswer'] = m.group(0).strip('()（）')
        else:
            # try to match by option text
            for opt in options:
                if opt['text'] and opt['text'] in ca:
                    parsed['correctAnswer'] = opt['key']
                    break

    # simple confidence heuristic
    present = 0
    total = 5
    for k in ['question', 'correctAnswer', 'wrongAnswer', 'reason', 'tags']:
        if parsed.get(k):
            present += 1
    parsed['confidence'] = round(present/total, 2)

    return parsed

@app.route('/ocr', methods=['POST'])
def ocr():
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400
    f = request.files['file']
    try:
        # Read image from upload
        # save a copy for debugging
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug_uploads')
        os.makedirs(debug_dir, exist_ok=True)
        saved_path = os.path.join(debug_dir, f.filename)
        f.stream.seek(0)
        with open(saved_path, 'wb') as out_f:
            out_f.write(f.stream.read())
        # reopen from saved file to ensure stream correctness
        img = Image.open(saved_path).convert('RGB')
        # Enhanced preprocessing using OpenCV + Pillow for better OCR
        def pil_to_cv(pil_img: Image.Image) -> np.ndarray:
            arr = np.array(pil_img)
            if arr.ndim == 2:
                return arr
            # RGB to BGR
            return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

        def cv_to_pil(cv_img: np.ndarray) -> Image.Image:
            if cv_img.ndim == 2:
                return Image.fromarray(cv_img)
            rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
            return Image.fromarray(rgb)

        def preprocess_cv(pil_img: Image.Image) -> Image.Image:
            cv_img = pil_to_cv(pil_img)
            # convert to grayscale
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            # resize if too small (improve DPI)
            h, w = gray.shape[:2]
            target_w = 1200
            if w < target_w:
                scale = target_w / float(w)
                gray = cv2.resize(gray, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_CUBIC)
            # denoise
            gray = cv2.bilateralFilter(gray, 9, 75, 75)
            # adaptive threshold
            th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, 31, 15)
            # morphological open to remove small noise
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1,1))
            opened = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel)

            # attempt to deskew using contours / minAreaRect
            coords = cv2.findNonZero(255 - opened)
            if coords is not None and len(coords) > 0:
                rect = cv2.minAreaRect(coords)
                angle = rect[-1]
                if angle < -45:
                    angle = -(90 + angle)
                else:
                    angle = -angle
                if abs(angle) > 0.5:
                    (h2, w2) = opened.shape[:2]
                    center = (w2 // 2, h2 // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    opened = cv2.warpAffine(opened, M, (w2, h2), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

            # optional sharpening via unsharp mask
            blurred = cv2.GaussianBlur(opened, (0,0), 3)
            sharpened = cv2.addWeighted(opened, 1.5, blurred, -0.5, 0)

            return cv_to_pil(sharpened)

        try:
            proc_img = preprocess_cv(img)
        except Exception:
            # fallback to simple Pillow preprocessing
            proc_img = ImageOps.grayscale(img)
            proc_img = ImageOps.autocontrast(proc_img)

        # Tesseract config
        tess_config = '--oem 3 --psm 6'
        # Prefer chi_sim if installed
        lang = 'chi_sim+eng' if 'chi_sim' in AVAILABLE_LANGS else 'eng'
        # basic plain text
        text = pytesseract.image_to_string(proc_img, lang=lang, config=tess_config)
        # HOCR (HTML-like) output
        try:
            hocr_bytes = pytesseract.image_to_pdf_or_hocr(proc_img, lang=lang, config=tess_config, extension='hocr')
            hocr_text = hocr_bytes.decode('utf-8', errors='ignore') if isinstance(hocr_bytes, (bytes, bytearray)) else str(hocr_bytes)
        except Exception as e_h:
            hocr_text = ''

        # TSV / detailed word-level data
        try:
            tsv_str = pytesseract.image_to_data(proc_img, lang=lang, config=tess_config, output_type=Output.STRING)
            tsv_dict = pytesseract.image_to_data(proc_img, lang=lang, config=tess_config, output_type=Output.DICT)
        except Exception as e_t:
            tsv_str = ''
            tsv_dict = {}

        # build words list from tsv_dict (if available)
        words = []
        if tsv_dict and 'text' in tsv_dict:
            n = len(tsv_dict['text'])
            for i in range(n):
                txt = tsv_dict['text'][i].strip() if tsv_dict['text'][i] else ''
                if not txt:
                    continue
                try:
                    left = int(tsv_dict.get('left', [0]*n)[i])
                    top = int(tsv_dict.get('top', [0]*n)[i])
                    width = int(tsv_dict.get('width', [0]*n)[i])
                    height = int(tsv_dict.get('height', [0]*n)[i])
                    conf = float(tsv_dict.get('conf', [-1]*n)[i])
                except Exception:
                    left = top = width = height = 0
                    try:
                        conf = float(tsv_dict.get('conf', [-1]*n)[i])
                    except Exception:
                        conf = -1
                words.append({'text': txt, 'left': left, 'top': top, 'width': width, 'height': height, 'conf': conf})

        parsed = parse_text(text)
        # include low-level OCR outputs for overlay and advanced parsing
        parsed['hocr'] = hocr_text
        parsed['tsv'] = tsv_str
        parsed['words'] = words
        # build higher-level blocks from word list
        try:
            parsed['blocks'] = build_blocks_from_words(words)
        except Exception:
            parsed['blocks'] = []

        # save debug hocr/tsv files alongside image for inspection
        base, _ext = os.path.splitext(saved_path)
        try:
            if hocr_text:
                with open(base + '.hocr', 'w', encoding='utf-8') as fh:
                    fh.write(hocr_text)
            if tsv_str:
                with open(base + '.tsv', 'w', encoding='utf-8') as ft:
                    ft.write(tsv_str)
        except Exception:
            pass

        return jsonify(parsed)
    except Exception as e:
        tb = traceback.format_exc()
        # return traceback in response for easier debugging in dev
        return jsonify({'error': str(e), 'traceback': tb}), 500


@app.route('/local_ai_ocr', methods=['POST'])
def local_ai_ocr():
    """Local PoC: use OCR outputs + simple rule-based/heuristic inference to produce
    structured JSON similar to LLM output. This is a placeholder for later plugging
    in a real local multimodal model (BLIP-2 + quantized LLM).
    """
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400
    f = request.files['file']
    try:
        # reuse same saving logic
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug_uploads')
        os.makedirs(debug_dir, exist_ok=True)
        saved_path = os.path.join(debug_dir, f.filename)
        f.stream.seek(0)
        with open(saved_path, 'wb') as out_f:
            out_f.write(f.stream.read())

        # Run OCR pipeline (same as /ocr) to get parsed structure
        img = Image.open(saved_path).convert('RGB')
        try:
            proc_img = preprocess_cv(img)
        except Exception:
            proc_img = ImageOps.grayscale(img)
            proc_img = ImageOps.autocontrast(proc_img)

        tess_config = '--oem 3 --psm 6'
        lang = 'chi_sim+eng' if 'chi_sim' in AVAILABLE_LANGS else 'eng'
        text = pytesseract.image_to_string(proc_img, lang=lang, config=tess_config)
        # minimal tsv/words extraction
        try:
            tsv_dict = pytesseract.image_to_data(proc_img, lang=lang, config=tess_config, output_type=Output.DICT)
        except Exception:
            tsv_dict = {}
        words = []
        if tsv_dict and 'text' in tsv_dict:
            n = len(tsv_dict['text'])
            for i in range(n):
                txt = tsv_dict['text'][i].strip() if tsv_dict['text'][i] else ''
                if not txt:
                    continue
                try:
                    left = int(tsv_dict.get('left', [0]*n)[i])
                    top = int(tsv_dict.get('top', [0]*n)[i])
                    width = int(tsv_dict.get('width', [0]*n)[i])
                    height = int(tsv_dict.get('height', [0]*n)[i])
                    conf = float(tsv_dict.get('conf', [-1]*n)[i])
                except Exception:
                    left = top = width = height = 0
                    try:
                        conf = float(tsv_dict.get('conf', [-1]*n)[i])
                    except Exception:
                        conf = -1
                words.append({'text': txt, 'left': left, 'top': top, 'width': width, 'height': height, 'conf': conf})

        parsed = parse_text(text)
        parsed['words'] = words
        parsed['blocks'] = build_blocks_from_words(words)

        # Run a lightweight rule-based inference to produce target schema
        result = heuristic_infer(parsed)
        # attach debug pointers
        result['debug'] = {'ocr_text': parsed.get('text', ''), 'blocks_count': len(parsed.get('blocks', []))}
        return jsonify(result)

    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({'error': str(e), 'traceback': tb}), 500


def perform_ocr(image_path):
    """执行OCR识别，返回解析后的数据"""
    img = Image.open(image_path).convert('RGB')
    try:
        proc_img = preprocess_cv(img)
    except Exception:
        proc_img = ImageOps.grayscale(img)
        proc_img = ImageOps.autocontrast(proc_img)

    tess_config = '--oem 3 --psm 6'
    lang = 'chi_sim+eng' if 'chi_sim' in AVAILABLE_LANGS else 'eng'
    text = pytesseract.image_to_string(proc_img, lang=lang, config=tess_config)
    
    print(f'[perform_ocr] OCR识别的文本: {text[:200] if text else "(空)"}')  # 打印OCR识别的文本

    # 提取单词信息
    try:
        tsv_dict = pytesseract.image_to_data(proc_img, lang=lang, config=tess_config, output_type=Output.DICT)
    except Exception:
        tsv_dict = {}

    words = []
    if tsv_dict and 'text' in tsv_dict:
        n = len(tsv_dict['text'])
        for i in range(n):
            txt = tsv_dict['text'][i].strip() if tsv_dict['text'][i] else ''
            if not txt:
                continue
            try:
                left = int(tsv_dict.get('left', [0]*n)[i])
                top = int(tsv_dict.get('top', [0]*n)[i])
                width = int(tsv_dict.get('width', [0]*n)[i])
                height = int(tsv_dict.get('height', [0]*n)[i])
                conf = float(tsv_dict.get('conf', [-1]*n)[i])
            except Exception:
                left = top = width = height = 0
                try:
                    conf = float(tsv_dict.get('conf', [-1]*n)[i])
                except Exception:
                    conf = -1
            words.append({'text': txt, 'left': left, 'top': top, 'width': width, 'height': height, 'conf': conf})

    parsed = parse_text(text)
    parsed['words'] = words
    parsed['blocks'] = build_blocks_from_words(words)

    return parsed


def save_to_backend(parsed_data, image_path, subject, semester, tags):
    """将OCR解析后的数据保存到后端API"""
    import base64

    # 准备上传到后端的数据
    question_data = {
        'subject': subject,
        'semester': semester,
        'question': parsed_data.get('question', ''),
        'correctAnswer': parsed_data.get('correctAnswer', ''),
        'wrongAnswer': parsed_data.get('wrongAnswer', ''),
        'reason': parsed_data.get('reason', ''),
        'tags': tags,
        'confidence': parsed_data.get('confidence', 0.0)
    }

    # 如果提供了图片，将其转换为base64编码以便传输
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        question_data['imageUrl'] = f"data:image/jpeg;base64,{encoded_string}"

    # 发送到后端API
    try:
        response = requests.post(f'{BACKEND_API_URL}/questions', json=question_data)
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'Failed to save to backend: {response.status_code}',
                'backend_error': response.text
            }

        saved_question = response.json()
        return {
            'success': True,
            'saved_question': saved_question
        }
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'Could not reach backend API: {str(e)}'
        }


def heuristic_infer(parsed):
    """Produce a simple structured inference from parsed OCR output.
    This is a PoC: fills question/options/answer/explanation/similar_questions
    using heuristics and OCR-parsed fields. Replace this function with model
    inference when integrating a local multimodal LLM.
    """
    full_text = parsed.get('text', '') or ''
    blocks = parsed.get('blocks', []) or []
    options = parsed.get('options', []) or []

    # Build base result
    q_text = parsed.get('question') or ''
    if not q_text and blocks:
        # take the largest block as question candidate
        blk = max(blocks, key=lambda b: (b['bbox']['width'] * b['bbox']['height']))
        q_text = blk.get('text', '')

    # normalize options
    opts = []
    for i, o in enumerate(options):
        key = o.get('key') or chr(65 + i)
        opts.append({'key': key, 'text': o.get('text', '')})

    # guess answer if parsed correctAnswer exists
    answer = parsed.get('correctAnswer') or ''
    # simple heuristic: if correctAnswer is long and matches option text, map to key
    if answer and len(answer) > 1 and opts:
        for opt in opts:
            if opt['text'] and opt['text'] in answer:
                answer = opt['key']
                break

    # simple explanation: echo nearby text or default message
    explanation = parsed.get('reason') or ''
    if not explanation:
        if '答案' in full_text or '解析' in full_text:
            # try extract after 解析
            m = re.search(r'解析[：:](.*)', full_text)
            if m:
                explanation = m.group(1).strip()
    if not explanation:
        explanation = '（自动推断）请人工核对并补充详细解析。'

    # similar questions: generate naive variants by shuffling numeric values or options
    similar = []
    if opts:
        # create two variants by rotating options text
        for k in range(2):
            new_opts = [{'key': o['key'], 'text': o['text']} for o in opts]
            # rotate texts
            texts = [o['text'] for o in new_opts]
            texts = texts[-(k+1):] + texts[:-(k+1)]
            for idx, o in enumerate(new_opts):
                o['text'] = texts[idx]
            similar.append({'question': q_text, 'options': new_opts, 'answer': new_opts[0]['key'], 'explanation': ''})

    res = {
        'question_id': None,
        'question': q_text,
        'type': 'single_choice' if opts else 'short_answer',
        'options': opts,
        'answer': answer,
        'explanation': explanation,
        'difficulty': 'medium',
        'tags': parsed.get('tags') or [],
        'confidence': parsed.get('confidence', 0.5),
        'source': {'ocr_snippet': full_text[:512]},
        'similar_questions': similar,
        'notes': 'heuristic PoC result; replace with model inference for higher quality'
    }
    return res

# 新增：将OCR结果直接保存到后端API的端点
@app.route('/process_and_save', methods=['POST'])
def process_and_save():
    """处理上传的图片，执行OCR，并将结果直接保存到后端API"""
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400

    f = request.files['file']

    try:
        # 保存上传的文件
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug_uploads')
        os.makedirs(debug_dir, exist_ok=True)
        saved_path = os.path.join(debug_dir, f.filename)
        f.stream.seek(0)
        with open(saved_path, 'wb') as out_f:
            out_f.write(f.stream.read())

        # 执行OCR
        parsed = perform_ocr(saved_path)

        # 获取表单数据
        subject = request.form.get('subject', 'unknown')
        semester = request.form.get('semester', '2024-秋季')
        tags_str = request.form.get('tags', '')
        tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()] if tags_str else []

        # 保存到后端
        save_result = save_to_backend(parsed, saved_path, subject, semester, tags)

        return jsonify({
            'save_result': save_result,
            'parsed_data': parsed
        })

    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({'error': str(e), 'traceback': tb}), 500


# 新增：仅执行OCR的端点
@app.route('/ocr_only', methods=['POST'])
def ocr_only():
    """仅执行OCR识别，不保存到后端"""
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400

    f = request.files['file']

    try:
        # 保存上传的文件
        debug_dir = os.path.join(os.path.dirname(__file__), 'debug_uploads')
        os.makedirs(debug_dir, exist_ok=True)
        saved_path = os.path.join(debug_dir, f.filename)
        f.stream.seek(0)
        with open(saved_path, 'wb') as out_f:
            out_f.write(f.stream.read())

        # 执行OCR
        parsed = perform_ocr(saved_path)

        return jsonify(parsed)

    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({'error': str(e), 'traceback': tb}), 500


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

        print('[intelligent_analyze] 尝试使用智谱AI...')
        api_llm = get_available_api_llm()
        model_name = getattr(api_llm, 'vision_model', 'unknown') if api_llm else 'None'
        print(f'[intelligent_analyze] 可用的 LLM: {model_name}')
        if api_llm:
            try:
                print(f'[intelligent_analyze] 开始调用 {model_name}...')
                # 折中方案：调用 analyze_question（2次调用：识别+分析）
                llm_result = api_llm.analyze_question('', saved_path)
                result['llm_analysis'] = llm_result
                result['llm_source'] = model_name
                print(f'[intelligent_analyze] {model_name} 分析成功')
            except Exception as e:
                tb = traceback.format_exc()
                print(f'[intelligent_analyze] {model_name} 失败: {e}')
                print(f'[intelligent_analyze] 错误详情:\n{tb}')
                result['error'] = f'API LLM failed: {str(e)}'

        # 如果 LLM 失败，返回错误信息
        if not result['llm_analysis']:
            result['llm_analysis'] = {
                'is_question': None,
                'error': 'No cloud LLM available',
                'message': '请配置智谱AI API密钥以启用智能分析'
            }
            result['llm_source'] = 'none'

        # 5. 格式化返回结果（将 LLM 分析结果转换为前端需要的格式）
        llm_analysis = result['llm_analysis']
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


@app.route('/ollama_analyze', methods=['POST'])
def ollama_analyze():
    """
    Ollama 本地识别端点
    使用本地 Ollama DeepSeek 模型进行视觉识别和题目分析
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

        # 2. 执行基础 OCR
        parsed = perform_ocr(saved_path)

        # 3. 使用 Ollama DeepSeek 进行智能分析
        result = {
            'ocr_result': parsed,
            'llm_analysis': None,
            'llm_source': None,
            'error': None
        }

        print('[ollama_analyze] 尝试使用 Ollama...')
        ollama_llm = get_available_llm()
        print(f'[ollama_analyze] 可用的 Ollama: {type(ollama_llm).__name__ if ollama_llm else "None"}')
        if ollama_llm:
            try:
                print(f'[ollama_analyze] 开始调用 {type(ollama_llm).__name__}...')
                llm_result = ollama_llm.analyze_question(
                    parsed.get('text', ''),
                    saved_path,
                    model='deepseek-r1:8b'
                )
                result['llm_analysis'] = llm_result
                result['llm_source'] = type(ollama_llm).__name__
                print(f'[ollama_analyze] {type(ollama_llm).__name__} 分析成功')
            except Exception as e:
                import traceback
                tb = traceback.format_exc()
                print(f'[ollama_analyze] {type(ollama_llm).__name__} 失败: {e}')
                print(f'[ollama_analyze] 错误详情:\n{tb}')
                result['error'] = f'Ollama LLM failed: {str(e)}'

        # 如果 LLM 失败，返回错误信息
        if not result['llm_analysis']:
            result['llm_analysis'] = {
                'is_question': None,
                'error': 'Ollama not available',
                'message': '请确保 Ollama 服务已启动并已下载 deepseek-r1:8b 模型'
            }
            result['llm_source'] = 'none'

        # 4. 合并结果，返回前端
        final_result = merge_ocr_and_llm(parsed, result['llm_analysis'])

        return jsonify(final_result)

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


def merge_vision_and_reasoning(ocr_result: Dict, vision_analysis: Dict, reasoning_analysis: Dict) -> Dict:
    """
    合并视觉识别和推理分析结果

    策略：
    - 推理分析结果优先级更高
    - 如果推理分析失败，回退到视觉识别
    """
    merged = {
        # OCR 基础数据（保留用于调试）
        'ocr_text': ocr_result.get('text', ''),
        'ocr_words': ocr_result.get('words', []),
        'ocr_blocks': ocr_result.get('blocks', []),

        # 视觉识别结果
        'vision_raw_response': vision_analysis.get('raw_response', '')[:500] if 'raw_response' in vision_analysis else '',

        # 推理分析结果
        'is_question': reasoning_analysis.get('is_question') if reasoning_analysis else vision_analysis.get('is_question'),
        'reasoning_raw_response': reasoning_analysis.get('raw_response', '')[:500] if 'raw_response' in reasoning_analysis else '',

        # 题目信息（优先推理分析，回退视觉识别）
        'subject': reasoning_analysis.get('subject') or vision_analysis.get('subject') or infer_subject_from_text(ocr_result.get('text', '')),
        'questionType': reasoning_analysis.get('question_type') or vision_analysis.get('question_type') or 'short_answer',
        'question': reasoning_analysis.get('question_text') or vision_analysis.get('question_text') or ocr_result.get('question', ''),
        'options': reasoning_analysis.get('options') or vision_analysis.get('options') or ocr_result.get('options', []),
        'correctAnswer': reasoning_analysis.get('correct_answer') or vision_analysis.get('correct_answer') or ocr_result.get('correctAnswer', ''),
        'explanation': reasoning_analysis.get('explanation') or vision_analysis.get('explanation') or ocr_result.get('reason', ''),
        'difficulty': reasoning_analysis.get('difficulty') or vision_analysis.get('difficulty', 'medium'),

        # 学生答案相关
        'studentAnswer': reasoning_analysis.get('student_answer') or vision_analysis.get('student_answer', ''),
        'studentAnswerBbox': reasoning_analysis.get('student_answer_bbox') or vision_analysis.get('student_answer_bbox', {}),
        'isWrong': reasoning_analysis.get('is_wrong') or vision_analysis.get('is_wrong', False),
        'errorType': reasoning_analysis.get('error_type') or vision_analysis.get('error_type', 'none'),
        'errorReason': reasoning_analysis.get('error_reason') or vision_analysis.get('error_reason', ''),

        # 年级和学期（优先推理分析）
        'grade': reasoning_analysis.get('grade') or vision_analysis.get('grade', ''),
        'semester': reasoning_analysis.get('semester') or vision_analysis.get('semester', ''),

        # 置信度
        'confidence': reasoning_analysis.get('confidence') or vision_analysis.get('confidence') or ocr_result.get('confidence', 0.5),

        # 错误信息
        'error': reasoning_analysis.get('error') or vision_analysis.get('error')
    }

    return merged


def merge_ocr_and_llm(ocr_result: Dict, llm_analysis: Dict) -> Dict:
    """
    合并 OCR 和 LLM 结果

    策略：
    - LLM 结果优先级更高
    - 如果 LLM 识别失败，回退到 OCR 解析
    """
    merged = {
        # OCR 基础数据（保留用于调试）
        'ocr_text': ocr_result.get('text', ''),
        'ocr_words': ocr_result.get('words', []),
        'ocr_blocks': ocr_result.get('blocks', []),

        # LLM 分析结果
        'is_question': llm_analysis.get('is_question'),
        'llm_raw_response': llm_analysis.get('raw_response', '')[:500] if 'raw_response' in llm_analysis else '',

        # 题目信息（优先 LLM，回退 OCR）
        'subject': llm_analysis.get('subject') or infer_subject_from_text(ocr_result.get('text', '')),
        'questionType': llm_analysis.get('question_type') or 'short_answer',
        'question': llm_analysis.get('question_text') or ocr_result.get('question', ''),
        'options': llm_analysis.get('options') or ocr_result.get('options', []),
        'correctAnswer': llm_analysis.get('correct_answer') or ocr_result.get('correctAnswer', ''),
        'explanation': llm_analysis.get('explanation') or ocr_result.get('reason', ''),
        'difficulty': llm_analysis.get('difficulty', 'medium'),

        # 学生答案相关
        'studentAnswer': llm_analysis.get('student_answer', ''),
        'studentAnswerBbox': llm_analysis.get('student_answer_bbox', {}),
        'isWrong': llm_analysis.get('is_wrong', False),
        'errorType': llm_analysis.get('error_type', 'none'),
        'errorReason': llm_analysis.get('error_reason', ''),

        # 年级和学期（LLM识别的）
        'grade': llm_analysis.get('grade', ''),
        'semester': llm_analysis.get('semester', ''),

        # 置信度
        'confidence': llm_analysis.get('confidence', ocr_result.get('confidence', 0.5)),

        # 错误信息
        'error': llm_analysis.get('error')
    }

    return merged


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

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)