const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

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

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wrong-question-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});