/**
 * API 响应类型定义
 */

/**
 * 统计数据类型
 */
export const STATISTICS_DATA = {
  TOTAL_QUESTIONS: 'totalQuestions',
  QUESTIONS_BY_SUBJECT: 'questionsBySubject',
  QUESTIONS_BY_SEMESTER: 'questionsBySemester',
  QUESTIONS_BY_TAG: 'questionsByTag',
  MONTHLY_GROWTH: 'monthlyGrowth'
};

/**
 * 题目数据类型
 */
export const QUESTION_DATA = {
  ID: 'id',
  SUBJECT: 'subject',
  QUESTION_TYPE: 'questionType',
  QUESTION_TEXT: 'question',
  OPTIONS: 'options',
  CORRECT_ANSWER: 'correctAnswer',
  STUDENT_ANSWER: 'studentAnswer',
  IS_WRONG: 'isWrong',
  ERROR_TYPE: 'errorType',
  ERROR_REASON: 'errorReason',
  EXPLANATION: 'explanation',
  REASONING_STEPS: 'reasoningSteps',
  DIFFICULTY: 'difficulty',
  CONFIDENCE: 'confidence',
  GRADE: 'grade',
  SEMESTER: 'semester',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TAGS: 'tags'
};

/**
 * API 响应类型
 */
export const API_RESPONSE = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
};

/**
 * 统计响应类型
 */
export const STATISTICS_RESPONSE = {
  TOTAL_COUNT: 'totalCount',
  SUBJECT_DISTRIBUTION: 'subjectDistribution',
  SEMESTER_DISTRIBUTION: 'semesterDistribution',
  TAG_DISTRIBUTION: 'tagDistribution',
  MONTHLY_TREND: 'monthlyTrend'
};
