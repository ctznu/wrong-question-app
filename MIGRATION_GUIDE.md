# MongoDB 到 PostgreSQL 迁移指南

本指南记录了将错题管理应用从 MongoDB 迁移到 PostgreSQL 的过程和剩余步骤。

## 已完成的工作

### 1. 依赖更新
- ✅ 更新了 `server/package.json`，添加了 PostgreSQL 依赖（pg, pg-hstore, sequelize）并移除了 MongoDB 依赖（mongoose）

### 2. 数据库配置
- ✅ 创建了 `server/config/db.js`，配置了 Sequelize 连接 PostgreSQL

### 3. 模型迁移
- ✅ 更新了 `server/models/User.js`，将 Mongoose 模型替换为 Sequelize 模型
- ✅ 更新了 `server/models/Question.js`，将 Mongoose 模型替换为 Sequelize 模型
- ✅ 更新了 `server/models/GeneratedQuestion.js`，将 Mongoose 模型替换为 Sequelize 模型

### 4. 服务器配置
- ✅ 更新了 `server/server.js`，将 MongoDB 连接替换为 PostgreSQL 连接，并添加了模型同步

### 5. 路由更新
- ✅ 更新了 `server/routes/auth.js`，将 MongoDB 特定的查询方法替换为 Sequelize 方法
- ✅ 更新了 `server/routes/questions.js`，将 MongoDB 特定的查询方法替换为 Sequelize 方法

## 剩余需要更新的文件

### 1. `server/routes/generatedQuestions.js`
需要将 MongoDB 特定的查询方法替换为 Sequelize 方法：
- `Question.findById()` → `Question.findByPk()`
- `GeneratedQuestion.create()` → `GeneratedQuestion.create()`（保持不变）
- `GeneratedQuestion.find()` → `GeneratedQuestion.findAll()`
- `GeneratedQuestion.findByIdAndUpdate()` → 先 `findByPk()` 再 `update()`
- `GeneratedQuestion.findByIdAndDelete()` → 先 `findByPk()` 再 `destroy()`

### 2. `server/routes/statistics.js`
需要将 MongoDB 特定的查询方法替换为 Sequelize 方法：
- `Question.find()` → `Question.findAll()`
- `Question.countDocuments()` → `Question.count()`

### 3. `server/routes/ai.js`
需要将 MongoDB 特定的查询方法替换为 Sequelize 方法：
- `Question.findById()` → `Question.findByPk()`
- `GeneratedQuestion.create()` → `GeneratedQuestion.create()`（保持不变）

### 4. `server/routes/users.js`
需要将 MongoDB 特定的查询方法替换为 Sequelize 方法：
- `User.findById()` → `User.findByPk()`
- `User.findOne()` → `User.findOne({ where: {...} })`
- `user.save()` → `user.save()`（保持不变）

### 5. `server/middleware/auth.js`（如果存在）
需要更新 JWT 验证逻辑，确保使用正确的用户 ID 类型（整数而不是 ObjectId）

## 数据库部署指南

### 在 Render 上部署 PostgreSQL 数据库

1. **登录 Render 控制台**
2. **点击 "New" → "PostgreSQL"**
3. **配置数据库**：
   - **Name**：数据库名称（如 `wrong-question-db`）
   - **Region**：选择离你最近的区域
   - **Instance Type**：选择 "Free"（免费计划）
   - **Database**：数据库名称（如 `wrong_question_app`）
   - **User**：用户名（如 `postgres`）
   - **Password**：自动生成或设置密码
4. **点击 "Create Database"**：等待数据库创建完成
5. **获取连接信息**：创建完成后，在数据库页面获取连接字符串

### 配置环境变量

在 Render 上为你的后端服务添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DB_NAME` | 数据库名称（如 `wrong_question_app`） | 数据库名称 |
| `DB_USER` | 数据库用户名（如 `postgres`） | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 | 数据库密码 |
| `DB_HOST` | 数据库主机地址 | 从 Render 数据库页面获取 |
| `DB_PORT` | 数据库端口（默认 5432） | 数据库端口 |
| `DB_DIALECT` | `postgres` | 数据库方言 |
| `JWT_SECRET` | 你的 JWT 密钥 | JWT 认证密钥 |

## 测试迁移

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 启动服务
```bash
npm start
```

### 3. 测试功能
- ✅ 用户注册和登录
- ✅ 创建和查询错题
- ✅ 生成类似题目
- ✅ 统计功能
- ✅ AI 分析功能

## 常见问题处理

### 1. 数据类型转换
- **ObjectId** → **INTEGER**：用户 ID 和问题 ID 从 MongoDB 的 ObjectId 转换为 PostgreSQL 的整数
- **嵌套对象** → **JSONB**：使用 PostgreSQL 的 JSONB 类型存储嵌套对象和数组

### 2. 查询方法转换
| MongoDB 方法 | Sequelize 方法 |
|-------------|---------------|
| `findById(id)` | `findByPk(id)` |
| `findOne({ field: value })` | `findOne({ where: { field: value } })` |
| `find({ field: value })` | `findAll({ where: { field: value } })` |
| `findOneAndUpdate({ _id: id }, { $set: fields })` | `findByPk(id).then(instance => instance.update(fields))` |
| `findOneAndDelete({ _id: id })` | `findByPk(id).then(instance => instance.destroy())` |
| `countDocuments({ field: value })` | `count({ where: { field: value } })` |

### 3. 路由参数处理
- 确保所有路由中的 `req.params.id` 被正确转换为整数类型
- 更新 JWT 中的用户 ID 类型，从字符串转换为整数

### 4. 环境变量配置
- 确保所有环境变量都已正确配置
- 移除所有 MongoDB 相关的环境变量（如 `MONGODB_URI`）

## 部署注意事项

### Render 部署
1. **确保所有路由文件都已更新**，避免 MongoDB 特定的查询方法
2. **配置正确的环境变量**，包括数据库连接信息和 JWT 密钥
3. **选择合适的实例类型**，免费计划适合小型应用
4. **监控部署日志**，及时发现和解决问题

### 数据迁移
- 如果需要保留现有数据，需要编写数据迁移脚本，将 MongoDB 数据导入到 PostgreSQL
- 或者，重新创建用户和错题数据

## 总结

通过本指南的步骤，你可以成功将错题管理应用从 MongoDB 迁移到 PostgreSQL，利用 Render 提供的免费 PostgreSQL 服务，实现全栈部署在同一平台上，简化部署和管理流程。

## 后续步骤

1. 更新剩余的路由文件
2. 配置 Render 上的 PostgreSQL 数据库
3. 部署后端服务到 Render
4. 测试所有功能
5. 优化数据库查询和性能
