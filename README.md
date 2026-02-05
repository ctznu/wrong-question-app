# 错题本应用 (Wrong Question App)

一个智能的错题本应用，使用 AI 技术帮助学生识别、分析和纠正错题。

## 功能特性

- 📷 **智能 OCR 识别**：使用智谱AI视觉模型（glm-4.6v-flash）识别题目图片
- 🤖 **AI 题目分析**：自动分析题目类型、难度、正确答案
- 📝 **错题原因分析**：识别错误类型（计算错误、概念不清、审题错误、粗心大意）
- 🔄 **类似题目生成**：根据错题自动生成类似题目供练习
- 📊 **统计分析**：统计错题类型、科目分布、错误趋势
- 👤 **用户认证**：支持注册和登录功能
- 📱 **视图模式持久化**：支持卡片和表格视图切换

## 技术栈

### 前端
- **React** - UI 框架
- **React Router** - 路由管理
- **Material-UI** - UI 组件库
- **Axios** - HTTP 客户端

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **MongoDB** - 数据库
- **JWT** - 身份认证

### OCR 服务
- **Python/Flask** - OCR 服务
- **智谱AI** - 云端 AI 服务（glm-4.6v-flash）
- **DeepSeek** - 本地 LLM 模型（可选）
- **Tesseract OCR** - 本地 OCR 备用方案

## 项目结构

```
wrong-question-app/
├── client/                 # 前端 React 应用
│   ├── public/
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── contexts/     # Context API
│   │   └── ...
│   └── ...
├── server/                # 后端 Node.js 服务器
│   ├── models/       # 数据模型
│   ├── routes/       # API 路由
│   ├── middleware/   # 中间件
│   └── ...
├── ocr_server/           # OCR Python 服务
│   ├── api_llm_client.py  # AI 客户端
│   ├── llm_client.py      # LLM 客户端
│   ├── app.py           # Flask 应用
│   └── requirements.md         # 项目依赖说明
└── README.md             # 项目说明
```

## 快速开始

### 环境要求
- Node.js 18+
- Python 3.8+
- MongoDB 4.4+
- npm 或 yarn

### 安装依赖
#### 前端和后端
```bash
npm install
```

#### OCR 服务
```bash
cd ocr_server
pip install -r requirements.txt
```

### 配置环境变量
创建 `.env` 文件（参考 `.env.example`）：

```bash
# 通用 API 密钥
TONGYI_API_KEY=your_tongyi_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
ZHIPU_API_KEY=your_zhipu_api_key_here

# 模型配置
ZHIPU_VISION_MODEL=glm-4.6v
ZHIPU_ANALYSIS_MODEL=glm-4.7-flash

# Ollama 模型（可选）
OLLAMA_MODEL=qwen2.5-vl:7b

# API 超时时间（秒）
API_TIMEOUT=60
```

### 启动服务
#### 启动后端
```bash
cd server
npm start
```

服务将在以下端口运行：
- 前端：http://localhost:3000
- 后端：http://localhost:5001
- OCR 服务：http://localhost:5000

#### 启动 OCR 服务
```bash
cd ocr_server
python app.py
```

## 使用说明

### 1. 用户注册和登录
首次使用需要注册账号：
1. 打开应用，点击"注册"
2. 填写用户名、密码和邮箱
3. 注册后登录

### 2. 上传错题图片
1. 点击"上传错题"或"开始识别"
2. 选择或拖拽错题图片
3. 系统自动识别题目内容、正确答案、学生答案、错误原因等

### 3. 查看识别结果
系统会自动分析并显示：
- 题目内容
- 题目类型（选择题、填空题等）
- 正确答案
- 学生答案
- 错误原因分析
- 错误类型（计算错误、概念不清、审题错误、粗心大意）
- 难度等级

### 4. 生成类似题目
1. 在错题详情页面点击"生成类似题目"
2. AI 自动生成 3 道类似题目
3. 可用于练习巩固

### 5. 查看统计
在"统计"页面查看：
- 错题类型分布
- 科目分布
- 错误趋势
- 学习进度

## API 端点

### OCR 服务
#### `POST /ocr`
使用 Tesseract OCR 识别图片（备用方案）

#### `POST /ollama_analyze`
使用 Ollama 本地模型分析题目

#### `POST /intelligent_analyze`
使用智谱AI视觉模型智能分析题目（推荐）

#### `POST /generate_similar_question`
生成类似题目

### 后端 API
#### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - 验证 Token

#### 题目管理
- `POST /api/questions` - 创建题目
- `GET /api/questions` - 获取题目列表
- `GET /api/questions/:id` - 获取题目详情
- `PUT /api/questions/:id` - 更新题目
- `DELETE /api/questions/:id` - 删除题目

#### AI 功能
- `POST /api/ai/analyze` - AI 分析题目
- `POST /api/ai/generate-similar` - 生成类似题目
- `GET /api/ai/statistics` - 获取统计数据

## 开发计划

- [ ] 支持批量上传图片
- [ ] 添加错题标签功能
- [ ] 添加学习进度追踪
- [ ] 支持错题分享功能
- [ ] 添加错题本模板
- [ ] 支持导出 PDF

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

---

**注意**：本项目使用 AI 服务，需要配置相应的 API 密钥才能使用完整功能。
