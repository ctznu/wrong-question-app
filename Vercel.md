# Vercel 详细部署指南（小白友好）

以下是针对小白用户的详细 Vercel 部署步骤，确保你能顺利部署错题管理系统。


## **前提准备**

在开始部署前，你需要：
1. **一个 GitHub 账号**（免费注册）
2. **项目代码**（已上传到 GitHub 仓库）
3. **基本的 Git 操作知识**（如何上传代码到 GitHub）


## **步骤 1：上传代码到 GitHub**

如果你的代码还没上传到 GitHub，请先完成这一步：

1. **创建 GitHub 仓库**：
   - 登录 GitHub，点击右上角的 `+` → `New repository`
   - 填写仓库名称（如 `wrong-question-app`）
   - 选择 `Public`（公开）或 `Private`（私有）
   - 点击 `Create repository`

2. **上传代码**：
   - 在本地项目根目录打开终端
   - 运行以下命令（替换为你的 GitHub 用户名和仓库名）：
     ```bash
     # 初始化 Git 仓库（如果还没初始化）
     git init

     # 添加所有文件
     git add .

     # 提交代码
     git commit -m "Initial commit"

     # 关联到 GitHub 仓库
     git remote add origin https://github.com/your-username/wrong-question-app.git

     # 推送到 GitHub
     git push -u origin main
     ```


## **步骤 2：注册 Vercel 账号**

1. **访问 Vercel 官网**：[https://vercel.com](https://vercel.com)
2. **注册账号**：
   - 点击 `Sign Up`
   - 选择 `Continue with GitHub`（推荐，后续部署更方便）
   - 按照提示授权 Vercel 访问你的 GitHub 账号


## **步骤 3：导入项目到 Vercel**

1. **登录 Vercel** 后，点击 `Add New` → `Project`
2. **导入 GitHub 仓库**：
   - 在 `Import Git Repository` 页面，找到你的 `wrong-question-app` 仓库
   - 点击 `Import` 按钮

3. **配置项目**：
   - **Project Name**：默认使用仓库名，可修改
   - **Framework Preset**：Vercel 会自动检测为 `Create React App`，保持默认
   - **Root Directory**：保持默认（`/`）
   - **Build and Output Settings**：保持默认（Vercel 会自动配置）
   - **Environment Variables**：暂时跳过，稍后配置

4. **点击 `Deploy`**：Vercel 会开始构建和部署你的项目


## **步骤 4：配置环境变量**

部署完成后，你需要配置环境变量（如 API 密钥）：

1. **进入项目设置**：
   - 部署完成后，点击 `Go to Dashboard`
   - 在项目页面，点击左侧 `Settings` → `Environment Variables`

2. **添加环境变量**：
   - 点击 `Add` 按钮，添加以下环境变量（根据你的实际配置）：
     | 变量名                | 值                                      | 说明                  |
     |----------------------|----------------------------------------|----------------------|
     | `REACT_APP_API_URL`  | `http://localhost:5000`                | 后端 API 地址（本地） |
     | `REACT_APP_BACKEND_API_URL` | `http://localhost:5001/api`       | Express 后端 API 地址 |
     | `ZHIPU_API_KEY`      | `your-zhipu-api-key`                   | 智谱 AI API 密钥     |
     | `TONGYI_API_KEY`     | `your-tongyi-api-key`                  | 通义千问 API 密钥     |
     | `HUNYUAN_API_KEY`    | `your-hunyuan-api-key`                 | 腾讯混元 API 密钥     |
     | `JWT_SECRET`         | `your-jwt-secret-key`                  | JWT 认证密钥          |

   - 注意：如果使用 Vercel 边缘函数作为后端，变量名可能需要调整（见步骤 6）。


## **步骤 5：重新部署**

添加环境变量后，需要重新部署以应用配置：
1. 在项目页面，点击 `Deployments`
2. 点击右侧的 `Redeploy` 按钮
3. 选择 `Redeploy` 确认


## **步骤 6：验证部署结果**

部署完成后：
1. 点击 `Visit` 按钮，打开部署后的网站
2. 验证以下功能：
   - 前端页面是否正常加载
   - 登录/注册功能是否可用
   - 上传图片并识别文字的功能是否正常
   - 与云 LLM API 的集成是否正常

如果遇到错误，检查：
- 环境变量是否正确配置（API 密钥是否有效）
- 浏览器控制台是否有错误信息
- Vercel 部署日志（在 `Deployments` 页面点击具体部署查看）


## **步骤 7：使用 Vercel 边缘函数作为轻量后端**

如果你的项目需要后端 API 支持，可以使用 Vercel 边缘函数：

1. **在项目根目录创建 `api` 文件夹**
2. **创建 API 路由文件**，例如 `api/analyze.js`：
   ```javascript
   // api/analyze.js
   export default async function handler(req, res) {
     try {
       // 处理 OCR 或 LLM 分析请求
       const { image } = req.body;
       // 调用云 LLM API（如智谱 AI）
       // ...
       res.status(200).json({ result: '分析结果' });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   }
   ```

3. **更新前端代码**，将 API 请求地址改为 Vercel 边缘函数：
   ```javascript
   // 原代码
   // const response = await fetch('http://localhost:5000/analyze');
   
   // 新代码
   const response = await fetch('/api/analyze');
   ```


## **步骤 8：自定义域名（可选）**

如果你有自己的域名，可以绑定到 Vercel 部署：

1. **在 Vercel 项目设置中**，点击 `Domains`
2. **输入你的域名**（如 `wrong-question.example.com`）
3. **按照提示配置 DNS**：
   - 登录你的域名注册商后台
   - 添加 CNAME 记录，指向 `cname.vercel-dns.com`
4. **等待 DNS 生效**（通常需要 5-30 分钟）
5. **验证域名**：Vercel 会自动检测并配置 HTTPS


## **常见问题解决**

1. **部署失败**：
   - 检查 Vercel 部署日志，查看具体错误信息
   - 确保 `package.json` 中有正确的 `build` 脚本
   - 确保依赖已正确安装（`npm install`）

2. **API 调用失败**：
   - 检查环境变量是否正确配置
   - 检查 API 密钥是否有效
   - 查看浏览器控制台的网络请求错误

3. **页面空白**：
   - 检查浏览器控制台的 JavaScript 错误
   - 确保前端代码没有引用本地路径（如 `http://localhost:3000`）


## **总结**

Vercel 是一个非常适合小白用户的部署平台，它：
- **自动配置**：无需手动设置构建流程
- **一键部署**：从 GitHub 推送代码后自动部署
- **免费额度**：足够个人或小型团队使用
- **支持轻量后端**：通过边缘函数处理 API 请求

按照以上步骤操作，你应该能够顺利部署错题管理系统，并开始使用它来管理和分析错题。如果遇到任何问题，随时参考 Vercel 官方文档或社区支持。