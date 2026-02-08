const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// 导入数据库配置
const { sequelize, testConnection } = require('./config/db');

// 导入模型
const User = require('./models/User');
const Question = require('./models/Question');
const GeneratedQuestion = require('./models/GeneratedQuestion');

const app = express();

// 配置 CORS
if (process.env.NODE_ENV === 'production') {
  // 生产环境：只允许特定域名
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  if (allowedOrigins.length > 0) {
    const corsOptions = {
      origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      optionsSuccessStatus: 200
    };
    app.use(cors(corsOptions));
  } else {
    // 如果没有配置允许的域名，默认允许所有
    app.use(cors());
  }
} else {
  // 开发环境：允许所有
  app.use(cors());
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const questionRoutes = require('./routes/questions');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const generatedQuestionRoutes = require('./routes/generatedQuestions');
const statisticsRoutes = require('./routes/statistics');

app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/generated-questions', generatedQuestionRoutes);
app.use('/api/statistics', statisticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 同步数据库模型
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 调用启动函数
startServer();