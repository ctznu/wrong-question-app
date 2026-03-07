import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, LinearProgress, Chip } from '@mui/material';
import { BarChart, PieChart, TrendingUp, Calendar, BookOpen, Award } from 'lucide-react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_BASE_URL = 'http://localhost:5001/api';

const DIFFICULTY_LABELS = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
};

const QUESTION_TYPE_LABELS = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  fill_blank: '填空题',
  short_answer: '简答题',
  essay: '作文题'
};

const SUBJECT_LABELS = {
  chinese: '语文',
  math: '数学',
  english: '英语',
  unknown: '其他'
};

const SEMESTER_LABELS = {
  '1-1': '一年级上',
  '1-2': '一年级下',
  '2-1': '二年级上',
  '2-2': '二年级下',
  '3-1': '三年级上',
  '3-2': '三年级下',
  '4-1': '四年级上',
  '4-2': '四年级下',
  '5-1': '五年级上',
  '5-2': '五年级下',
  '6-1': '六年级上',
  '6-2': '六年级下',
};

function Statistics() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    questionsBySubject: {},
    questionsBySemester: {},
    questionsByTag: {},
    questionsByDifficulty: {},
    questionsByQuestionType: {},
    monthlyGrowth: [],
    wrongRate: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['x-auth-token'] = token;
      }

      const response = await fetch(`${API_BASE_URL}/statistics`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取统计数据失败');
      }

      const data = await response.json();
      
      // 计算薄弱学科
      let weakSubject = '无';
      if (data.questionsBySubject && Object.keys(data.questionsBySubject).length > 0) {
        const entries = Object.entries(data.questionsBySubject);
        const maxEntry = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max, entries[0]);
        weakSubject = SUBJECT_LABELS[maxEntry[0]] || maxEntry[0];
      }
      data.weakSubject = weakSubject;
      
      setStats(data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 图表配置
  const barChartData = {
    labels: Object.keys(stats.questionsBySubject).map(key => SUBJECT_LABELS[key] || key),
    datasets: [
      {
        label: '题目数量',
        data: Object.values(stats.questionsBySubject),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: Object.keys(stats.questionsBySemester).map(key => SEMESTER_LABELS[key] || key),
    datasets: [
      {
        data: Object.values(stats.questionsBySemester),
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '各学科题目分布',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '各学期题目分布',
      },
    },
  };

  const difficultyData = {
    labels: Object.keys(stats.questionsByDifficulty).map(key => DIFFICULTY_LABELS[key] || key),
    datasets: [
      {
        data: Object.values(stats.questionsByDifficulty),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const questionTypeData = {
    labels: Object.keys(stats.questionsByQuestionType).map(key => QUESTION_TYPE_LABELS[key] || key),
    datasets: [
      {
        data: Object.values(stats.questionsByQuestionType),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '题目难度分布',
      },
    },
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="app-main-container" sx={{ px: { xs: 0, sm: 2 } }}>
        <Container maxWidth="lg" sx={{ mt: 2, px: { xs: 0, sm: 2 } }}>
          <Paper className="upload-area-container" sx={{ mx: { xs: 0, sm: 'auto' } }}>
            <Typography variant="h5" className="upload-area-title" gutterBottom>
              <BarChart size={24} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
              数据统计与分析
            </Typography>
            <Box sx={{ width: '100%', mt: 4 }}>
              <LinearProgress />
              <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
                正在加载统计数据...
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="app-main-container" sx={{ px: { xs: 0, sm: 2 } }}>
      <Container maxWidth="lg" sx={{ mt: 2, px: { xs: 0, sm: 2 } }}>
        <Paper className="upload-area-container" sx={{ mx: { xs: 0, sm: 'auto' } }}>
          <Typography variant="h5" className="upload-area-title" gutterBottom>
            <BarChart size={24} style={{ verticalAlign: 'middle', marginRight: '12px' }} />
            数据统计与分析
          </Typography>

          {/* 统计卡片 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <TrendingUp size={40} color="#1976d2" style={{ marginBottom: '10px' }} />
                  <Typography variant="h4" component="div">
                    {stats.totalQuestions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    总题目数
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <BookOpen size={40} color="#4caf50" style={{ marginBottom: '10px' }} />
                  <Typography variant="h4" component="div">
                    {Object.keys(stats.questionsBySubject).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    学科种类
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Calendar size={40} color="#ff9800" style={{ marginBottom: '10px' }} />
                  <Typography variant="h4" component="div">
                    {Object.keys(stats.questionsBySemester).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    学期数量
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <PieChart size={40} color="#9c27b0" style={{ marginBottom: '10px' }} />
                  <Typography variant="h4" component="div">
                    {Object.keys(stats.questionsByTag).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    标签种类
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Award size={40} color="#f44336" style={{ marginBottom: '10px' }} />
                  <Typography variant="h4" component="div">
                    {stats.weakSubject || '无'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    薄弱学科
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 图表区域 */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Bar data={barChartData} options={barOptions} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Pie data={pieChartData} options={pieOptions} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Doughnut data={difficultyData} options={doughnutOptions} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Doughnut 
                  data={questionTypeData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: '题目类型分布',
                      },
                    },
                  }} 
                />
              </Paper>
            </Grid>
          </Grid>

          {/* 标签分布 */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChart size={20} style={{ marginRight: '8px' }} />
              标签分布
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.keys(stats.questionsByTag).length === 0 ? (
                <Typography variant="body2" color="text.secondary">暂无标签</Typography>
              ) : (
                Object.entries(stats.questionsByTag).map(([tag, count]) => (
                  <Chip
                    key={tag}
                    label={`${tag} (${count})`}
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))
              )}
            </Box>
          </Paper>

          {/* 月度增长趋势 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={20} style={{ marginRight: '8px' }} />
              月度增长趋势
            </Typography>
            <Bar 
              data={{
                labels: stats.monthlyGrowth.map(item => item.month),
                datasets: [
                  {
                    label: '新增题目数',
                    data: stats.monthlyGrowth.map(item => item.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: '每月新增题目数量',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </Paper>
        </Paper>
      </Container>
    </Container>
  );
}

export default Statistics;