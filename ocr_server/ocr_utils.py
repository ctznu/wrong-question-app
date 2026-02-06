from PIL import Image, ImageOps
import cv2
import numpy as np
import pytesseract
from pytesseract import Output
import os
import shutil
import subprocess

def locate_tesseract():
    exe = shutil.which('tesseract')
    if exe:
        return exe
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
    print(f'[ocr_utils] Using tesseract executable: {tess_cmd}')
else:
    print('[ocr_utils] WARNING: tesseract executable not found in PATH or common locations')

def get_installed_languages():
    try:
        out = subprocess.run([pytesseract.pytesseract.tesseract_cmd, '--list-langs'], capture_output=True, text=True, check=True)
        lines = [l.strip() for l in out.stdout.splitlines() if l.strip()]
        langs = []
        for l in lines:
            if l.lower().startswith('list of'):
                continue
            parts = l.split()
            for p in parts:
                if p:
                    langs.append(p)
        return langs
    except Exception as e:
        print('[ocr_utils] Could not list tesseract languages:', e)
        return []

AVAILABLE_LANGS = get_installed_languages()
print(f'[ocr_utils] Installed tesseract languages: {AVAILABLE_LANGS}')

def build_blocks_from_words(words, line_threshold=10):
    if not words:
        return []
    
    sorted_words = sorted(words, key=lambda w: w['top'])
    
    blocks = []
    current_line_top = sorted_words[0]['top']
    current_line = {'text': '', 'bbox': {'left': float('inf'), 'top': current_line_top, 'width': 0, 'height': 0}, 'words': []}
    
    for word in sorted_words:
        if abs(word['top'] - current_line_top) < line_threshold:
            if current_line['text']:
                current_line['text'] += ' '
            current_line['text'] += word['text']
            current_line['words'].append(word)
            current_line['bbox']['left'] = min(current_line['bbox']['left'], word['left'])
            current_line['bbox']['width'] = max(current_line['bbox']['width'], word['left'] + word['width']) - current_line['bbox']['left']
            current_line['bbox']['height'] = max(current_line['bbox']['height'], word['top'] + word['height']) - current_line['bbox']['top']
        else:
            if current_line['words']:
                blocks.append(current_line)
            
            current_line_top = word['top']
            current_line = {
                'text': word['text'],
                'bbox': {'left': word['left'], 'top': word['top'], 'width': word['width'], 'height': word['height']},
                'words': [word]
            }
    
    if current_line['words']:
        blocks.append(current_line)
    
    return blocks

def parse_text(text):
    import re
    
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

    if not parsed.get('wrongAnswer'):
        parsed['reason'] = ''

    options = []
    for m in re.finditer(r'(?m)^[ \t]*([A-D])\s*[\.|\)|、|．|：|:]\s*(.+)$', text):
        options.append({'key': m.group(1), 'text': m.group(2).strip()})

    if not options:
        for m in re.finditer(r'(?m)^[ \t]*[\(（]?([A-D])[\)）]\s*(.+)$', text):
            options.append({'key': m.group(1), 'text': m.group(2).strip()})

    if not options:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        candidates = [l for l in lines if 1 < len(l) < 120 and (len(l.split()) < 20)]
        for i, line in enumerate(lines):
            if re.search(r'选项|选', line):
                for j in range(i+1, min(i+6, len(lines))):
                    candidates.append(lines[j])
                break
        if candidates and len(candidates) <= 6 and len(candidates) >= 2:
            for idx, c in enumerate(candidates[:6]):
                options.append({'key': chr(ord('A')+idx), 'text': c})

    parsed['options'] = options

    ca = parsed.get('correctAnswer', '')
    if ca:
        ca = ca.strip()
        m = re.match(r'^[\(（]?[A-D][\)）]?', ca)
        if m:
            parsed['correctAnswer'] = m.group(0).strip('()（）')
        else:
            for opt in options:
                if opt['text'] and opt['text'] in ca:
                    parsed['correctAnswer'] = opt['key']
                    break

    present = 0
    total = 5
    for k in ['question', 'correctAnswer', 'wrongAnswer', 'reason', 'tags']:
        if parsed.get(k):
            present += 1
    parsed['confidence'] = round(present/total, 2)

    return parsed

def perform_ocr(image_path):
    img = Image.open(image_path).convert('RGB')
    try:
        proc_img = preprocess_cv(img)
    except Exception:
        proc_img = ImageOps.grayscale(img)
        proc_img = ImageOps.autocontrast(proc_img)

    tess_config = '--oem 3 --psm 6'
    lang = 'chi_sim+eng' if 'chi_sim' in AVAILABLE_LANGS else 'eng'
    text = pytesseract.image_to_string(proc_img, lang=lang, config=tess_config)
    
    print(f'[perform_ocr] OCR识别的文本: {text[:200] if text else "(空)"}')

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

def preprocess_cv(pil_img):
    def pil_to_cv(pil_img):
        arr = np.array(pil_img)
        if arr.ndim == 2:
            return arr
        return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

    def cv_to_pil(cv_img):
        if cv_img.ndim == 2:
            return Image.fromarray(cv_img)
        rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb)

    cv_img = pil_to_cv(pil_img)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]
    target_w = 1200
    if w < target_w:
        scale = target_w / float(w)
        gray = cv2.resize(gray, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_CUBIC)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                       cv2.THRESH_BINARY, 31, 15)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1,1))
    opened = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel)

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

    blurred = cv2.GaussianBlur(opened, (0,0), 3)
    sharpened = cv2.addWeighted(opened, 1.5, blurred, -0.5, 0)

    return cv_to_pil(sharpened)
