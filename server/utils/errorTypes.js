/**
 * 错误类型定义
 */
const ERROR_TYPES = {
  CALCULATION: {
    value: 'calculation',
    label: '计算错误',
    description: '计算过程中出现的算术错误',
    examples: ['加减乘除计算错误', '小数点位置错误', '负数符号错误']
  },
  CONCEPT: {
    value: 'concept',
    label: '概念不清',
    description: '对基本概念理解不清晰',
    examples: ['公式记忆错误', '概念混淆', '定义理解偏差']
  },
  READING: {
    value: 'reading',
    label: '审题错误',
    description: '未正确理解题目要求',
    examples: ['漏看题目条件', '误解题意', '答非所问']
  },
  CARELESS: {
    value: 'careless',
    label: '粗心大意',
    description: '非知识性错误，因马虎导致',
    examples: ['抄写错误', '漏题', '单位写错']
  },
  NONE: {
    value: 'none',
    label: '无错误',
    description: '答案正确或无学生答案',
    examples: []
  }
};

/**
 * 获取错误类型列表
 */
function getErrorTypes() {
  return Object.values(ERROR_TYPES);
}

/**
 * 获取错误类型数组（仅值）
 */
function getErrorTypeValues() {
  return Object.values(ERROR_TYPES).map(type => type.value);
}

/**
 * 根据值获取错误类型
 */
function getErrorType(value) {
  return Object.values(ERROR_TYPES).find(type => type.value === value) || ERROR_TYPES.NONE;
}

/**
 * 验证错误类型
 */
function isValidErrorType(value) {
  return Object.values(ERROR_TYPES).some(type => type.value === value);
}

/**
 * 根据标签获取错误类型
 */
function getErrorTypeByLabel(label) {
  return Object.values(ERROR_TYPES).find(type => type.label === label);
}

module.exports = {
  ERROR_TYPES,
  getErrorTypes,
  getErrorTypeValues,
  getErrorType,
  isValidErrorType,
  getErrorTypeByLabel
};
