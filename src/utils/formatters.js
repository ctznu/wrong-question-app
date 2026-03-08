/**
 * 格式化函数
 */

/**
 * 获取当前学期
 */
export const getCurrentSemester = (currentGrade) => {
  if (!currentGrade) return '';
  
  const now = new Date();
  const month = now.getMonth() + 1;
  
  if (month >= 9 || month <= 2) {
    return `${currentGrade}-上`;
  } else {
    return `${currentGrade}-下`;
  }
};

/**
 * 获取年级标签
 */
export const getGradeLabel = (grade) => {
  const gradeMap = {
    '1': '一年级',
    '2': '二年级',
    '3': '三年级',
    '4': '四年级',
    '5': '五年级',
    '6': '六年级'
  };
  return gradeMap[grade] || grade;
};

/**
 * 格式化学期
 */
export const formatSemester = (semester) => {
  if (!semester) return semester;
  const [grade, semesterType] = semester.split('-');
  return `${getGradeLabel(grade)}-${semesterType}`;
};

/**
 * 格式化学期选项
 */
export const getSemesterOptions = (currentGrade) => {
  if (!currentGrade) return [];
  
  const options = [];
  const currentGradeNum = parseInt(currentGrade);
  const maxGrade = 6;
  
  for (let grade = currentGradeNum; grade <= maxGrade; grade++) {
    options.push(`${grade}-上`);
    options.push(`${grade}-下`);
  }
  
  return options;
};

/**
 * 格式化日期时间为友好格式
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};
