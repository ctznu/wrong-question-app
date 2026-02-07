/**
 * 格式化函数
 */

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
  
  const now = new Date();
  const month = now.getMonth() + 1;
  
  const options = [];
  
  for (let i = 0; i < 2; i++) {
    const grade = parseInt(currentGrade) - i;
    if (grade >= 1) {
      options.push(`${grade}-上`);
      options.push(`${grade}-下`);
    }
  }
  
  return options;
};
