# MongoDB 部署指南（配合 Render 使用）

Render 本身没有内置的 MongoDB 服务，但你可以使用 **MongoDB Atlas**（MongoDB 的官方云服务）来部署 MongoDB 数据库。以下是详细的配置步骤：

## 步骤 1：注册 MongoDB Atlas 账户

1. **访问 MongoDB Atlas**：
   - 打开 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - 点击 "Start Free" 开始免费注册

2. **创建账户**：
   - 填写邮箱、密码等信息
   - 选择 "I'm learning MongoDB" 或 "I'm evaluating MongoDB"
   - 完成注册流程

## 步骤 2：创建免费 MongoDB 集群

1. **登录 MongoDB Atlas**：
   - 使用新注册的账户登录

2. **创建集群**：
   - 选择 "Shared Cluster"（免费计划）
   - 选择云服务提供商（推荐 AWS、Azure 或 GCP）
   - 选择离你最近的区域（如 Asia Pacific - Mumbai 或 Singapore）
   - 点击 "Create Cluster"（需要几分钟时间配置）

3. **等待集群创建完成**：
   - 集群状态变为 "Available" 表示创建成功

## 步骤 3：配置 MongoDB 访问权限

1. **添加 IP 地址**：
   - 在集群页面，点击 "Connect"
   - 选择 "Connect your application"
   - 在 "Add your current IP address" 部分，点击 "Add IP Address"
   - 为了允许 Render 服务器访问，添加 `0.0.0.0/0`（允许所有 IP 访问，生产环境建议更严格）
   - 点击 "Confirm"

2. **创建数据库用户**：
   - 在同一页面，创建一个新的数据库用户
   - 用户名：自定义（如 `appuser`）
   - 密码：使用自动生成的安全密码，或设置自己的密码
   - 角色：选择 "Read and write to any database"
   - 点击 "Create Database User"

## 步骤 4：获取 MongoDB 连接字符串

1. **生成连接字符串**：
   - 在 "Connect your application" 页面
   - 选择 "Driver" 为 "Node.js"
   - 版本选择 "4.0 or later"
   - 复制生成的连接字符串（格式如 `mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/myFirstDatabase`）

2. **修改连接字符串**：
   - 将 `<username>` 替换为你创建的数据库用户名
   - 将 `<password>` 替换为你设置的密码
   - 将 `myFirstDatabase` 替换为你的数据库名称（如 `wrong-question-app`）

## 步骤 5：在 Render 中配置 MongoDB 连接

1. **登录 Render 控制台**：
   - 进入你的 Express 服务配置页面

2. **添加环境变量**：
   - 找到 "Environment Variables" 部分
   - 添加以下环境变量：
     | 变量名 | 值 |
     |--------|-----|
     | `MONGODB_URI` | 你修改后的 MongoDB 连接字符串 |

3. **重新部署服务**：
   - 点击 "Deploy" 或 "Redeploy" 按钮
   - 等待部署完成

## 步骤 6：验证 MongoDB 连接

1. **检查部署日志**：
   - 在 Render 控制台中，查看部署日志
   - 确认没有 MongoDB 连接错误

2. **测试 API 端点**：
   - 使用 Postman 或浏览器访问你的 API 端点
   - 测试需要数据库操作的功能（如用户注册、创建错题等）

3. **查看 MongoDB Atlas 监控**：
   - 登录 MongoDB Atlas，进入集群页面
   - 查看 "Metrics" 标签页，确认有连接活动

## 常见问题排查

### 1. 连接失败错误

- **原因**：连接字符串格式错误，或 IP 地址未正确添加
- **解决方案**：
  - 检查连接字符串中的用户名、密码和数据库名称
  - 确认 `0.0.0.0/0` 已添加到 IP 白名单
  - 验证 MongoDB Atlas 集群状态为 "Available"

### 2. 认证失败错误

- **原因**：数据库用户名或密码错误
- **解决方案**：
  - 确认连接字符串中的用户名和密码正确
  - 在 MongoDB Atlas 中重新创建数据库用户，生成新的连接字符串

### 3. 数据库操作错误

- **原因**：数据库不存在，或集合未创建
- **解决方案**：
  - MongoDB 会自动创建不存在的数据库和集合
  - 检查 Express 代码中的数据库操作逻辑
  - 查看 MongoDB Atlas 中的 "Collections" 标签页，确认数据是否正确存储

## 总结

通过 MongoDB Atlas 配合 Render 使用，你可以：
- ✅ 使用免费的 MongoDB 云服务
- ✅ 获得稳定可靠的数据库性能
- ✅ 支持自动备份和监控
- ✅ 轻松扩展到更大的集群（如果需要）

这种配置方式适合你的错题管理应用，既经济实惠又易于维护。