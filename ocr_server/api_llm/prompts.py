"""公共提示词"""


def get_similar_question_prompt(question_text: str, error_type: str, error_reason: str, grade: str = '') -> str:
    """获取生成类似题目的提示词"""
    grade_context = ""
    if grade:
        grade_labels = {
            '1': '一年级', '2': '二年级', '3': '三年级',
            '4': '四年级', '5': '五年级', '6': '六年级'
        }
        grade_label = grade_labels.get(str(grade), f'{grade}年级')
        grade_context = f"学生年级：{grade_label}\n"
    
    return f"""根据以下错题生成一道类似题目：

{grade_context}原题：{question_text}
错误类型：{error_type}
错误原因：{error_reason}

要求：
1. 难度和原题相当，适合{grade_label if grade else '相应年级'}学生
2. 针对错误原因设计
3. 数字适当变化
4. 确保计算正确

输出JSON格式：
{{
  "question_text": "新题目内容",
  "correct_answer": "正确答案",
  "explanation": "解题思路（50字以内）"
}}

只输出JSON。"""


def get_generic_analysis_prompt(ocr_text: str, grade: str = '') -> str:
    """获取通用分析提示词 - 精简版"""
    grade_info = ""
    if grade:
        grade_labels = {
            '1': '一年级', '2': '二年级', '3': '三年级',
            '4': '四年级', '5': '五年级', '6': '六年级'
        }
        grade_label = grade_labels.get(str(grade), f'{grade}年级')
        grade_info = f"\n**学生年级**：{grade_label}（请使用该年级学生能理解的知识和方法）"
    
    return f"""你是一位经验丰富的小学教师，正在分析学生的错题。{grade_info}

**OCR识别的文字：**
{ocr_text}

**核心任务：**
1. 区分印刷体（题目）和手写体（学生答案）
2. 提取干净的题干，保留括号、横线等占位符
3. 独立计算/推理出正确答案
4. 判断学生答案是否正确，分析错误原因

**输出格式（JSON）：**
{{
  "question_text": "题目内容（只含印刷体，括号横线保持原样）",
  "student_answer": "学生答案（只含手写体，多个用逗号分隔，无手写则为空字符串）",
  "correct_answer": "正确答案（你独立推理得出，不受学生答案影响）",
  "is_wrong": true/false,
  "error_type": "calculation/concept/reading/careless/none",
  "error_reason": "用小学生能懂的话解释错在哪（简洁）",
  "explanation": "解题思路（简洁）",
  "reasoning_steps": "详细推理过程",
  "subject": "math/chinese/english"
}}

**错误类型：**
- calculation: 计算过程出错（加减乘除、进位借位等）
- concept: 概念理解错误（公式、定义混淆等）
- reading: 审题理解错误（看错题、理解偏差等）
- careless: 粗心大意（漏写、抄错等）
- none: 答案正确

**重要要求：**
- 正确答案必须独立推理，不受学生答案影响
- 学生答案必须是实际识别到的手写内容
- 所有分析内容简洁明了，适合小学生理解
- 英语题目的分析内容使用中文

只输出JSON，不要其他内容。"""