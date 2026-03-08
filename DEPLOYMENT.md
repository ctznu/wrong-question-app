# 自动化部署说明

本项目使用 GitHub Actions 实现自动化部署到阿里云服务器。

## 一、前提条件

- 服务器已安装 Nginx
- 服务器已创建网站目录
- 有服务器的 SSH 访问权限

## 二、配置步骤

### 1. 在 GitHub 仓库中配置 Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret

需要添加以下 Secrets：

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 地址 | `123.45.67.89` |
| `SERVER_USERNAME` | 服务器用户名 | `root` |
| `SSH_PRIVATE_KEY` | SSH 私钥 | 见下方说明 |
| `API_BASE_URL` | 后端 API 地址 | `http://api.example.com/api` |
| `OCR_SERVER_URL` | OCR 服务地址 | `http://ocr.example.com` |

### 2. 生成 SSH 密钥（如果没有）

在本地电脑执行：

```bash
# 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "github-actions"

# 查看公钥（添加到服务器）
cat ~/.ssh/id_rsa.pub

# 查看私钥（添加到 GitHub Secrets）
cat ~/.ssh/id_rsa
```

### 3. 将公钥添加到服务器

SSH 登录到服务器，执行：

```bash
# 将公钥添加到 authorized_keys
echo "你的公钥内容" >> ~/.ssh/authorized_keys

# 设置权限
chmod 600 ~/.ssh/authorized_keys
```

### 4. 将私钥添加到 GitHub Secrets

复制完整的私钥内容（包括 `-----BEGIN RSA PRIVATE KEY-----` 和 `-----END RSA PRIVATE KEY-----`），添加到 `SSH_PRIVATE_KEY`。

### 5. 确认网站目录

你的网站目录是：`/usr/share/nginx/html/`

确保该目录有正确的权限：

```bash
sudo chown -R $USER:$USER /usr/share/nginx/html
sudo chmod -R 755 /usr/share/nginx/html
```

## 三、配置 Nginx

创建或修改 Nginx 配置文件：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

重载 Nginx：

```bash
sudo nginx -t
sudo nginx -s reload
```

## 四、自动部署流程

配置完成后，每次 push 到 master 分支，GitHub Actions 会自动：

1. ✅ 拉取最新代码
2. ✅ 安装依赖 (`npm ci`)
3. ✅ 构建项目 (`npm run build`)
4. ✅ 打包 build 目录
5. ✅ 上传到服务器
6. ✅ 解压到网站目录
7. ✅ 重启 Nginx

## 五、手动触发部署

除了自动部署，也可以手动触发：

1. 进入 GitHub 仓库
2. 点击 Actions 标签
3. 选择 "Deploy to Aliyun" 工作流
4. 点击 "Run workflow"

## 六、查看部署日志

在 GitHub Actions 页面可以查看完整的部署日志，包括：
- 构建是否成功
- 上传是否成功
- 部署是否完成

## 七、常见问题

### 问题 1：SSH 连接失败

**原因**：私钥格式不正确或公钥未添加到服务器

**解决**：
- 确保 SSH_PRIVATE_KEY 包含完整的私钥内容
- 确保公钥已添加到服务器的 `~/.ssh/authorized_keys`

### 问题 2：权限不足

**原因**：用户没有权限写入网站目录

**解决**：
```bash
sudo chown -R $USER:$USER /usr/share/nginx/html
```

### 问题 3：Nginx 重启失败

**原因**：Nginx 配置文件有误

**解决**：
```bash
sudo nginx -t  # 检查配置
```

## 八、安全建议

1. ✅ 使用专门的 SSH 密钥用于部署
2. ✅ 不要使用 root 用户，创建专门的部署用户
3. ✅ 限制 SSH 密钥的权限（只允许特定 IP）
4. ✅ 定期更换 SSH 密钥

## 九、回滚操作

如果部署出现问题，可以在服务器上手动回滚：

```bash
# 查看历史构建
ls -la /var/www/html/wrong-question-app-backups/

# 回滚到上一个版本
sudo rm -rf /var/www/html/wrong-question-app
sudo cp -r /var/www/html/wrong-question-app-backups/build_20240101_120000 /var/www/html/wrong-question-app
sudo nginx -s reload
```

## 十、监控和告警

建议配置部署失败的告警通知：
- GitHub Actions 可以配置邮件通知
- 可以集成企业微信/钉钉机器人通知

---

部署配置完成后，你只需要：
1. 本地修改代码
2. `git push origin master`
3. 等待几分钟后，网站自动更新完成！