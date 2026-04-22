# 贡献指南

感谢你对 claude-nvidia-proxy 项目的兴趣！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug

1. 在 [GitHub Issues](https://github.com/hexoh/claude-nvidia-proxy/issues) 中搜索现有问题
2. 如果没有找到相关问题，创建一个新的 Issue
3. 提供详细的信息：
   - 问题描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（Node.js 版本、操作系统等）
   - 相关日志或错误信息

### 提出新功能

1. 在 [GitHub Discussions](https://github.com/hexoh/claude-nvidia-proxy/discussions) 中讨论你的想法
2. 获得反馈后，创建一个 Feature Request Issue
3. 描述新功能的用例和预期行为

### 提交代码

#### 1. Fork 仓库

点击 GitHub 页面上的 "Fork" 按钮。

#### 2. 克隆你的 Fork

```bash
git clone https://github.com/hexoh/claude-nvidia-proxy.git
cd claude-nvidia-proxy
```

#### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

#### 4. 进行更改

- 遵循现有的代码风格
- 添加必要的注释
- 更新相关文档
- 添加测试（如果适用）

#### 5. 运行测试

```bash
npm install
npm test
npm run build
```

#### 6. 提交更改

```bash
git add .
git commit -m "feat: add your feature description"
# 或
git commit -m "fix: describe your bug fix"
```

#### 7. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

#### 8. 创建 Pull Request

1. 访问你的 Fork 页面
2. 点击 "New Pull Request"
3. 填写 PR 描述：
   - 清晰的标题
   - 详细的描述
   - 相关 Issue 的链接
   - 截图（如果适用）

## 代码规范

### JavaScript/Node.js

- 使用 ES6+ 语法
- 遵循 Airbnb JavaScript 风格指南
- 使用有意义的变量和函数名
- 添加 JSDoc 注释

### 提交信息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**

```bash
feat(api): add support for streaming responses

fix(proxy): handle missing usage field in streaming responses

docs(readme): update installation instructions

test(proxy): add integration tests for tool calls
```

## 开发环境设置

### 前置要求

- Node.js >= 18.0.0
- npm 或 pnpm
- Git

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 运行开发服务器

```bash
npm run dev
# 或
node src/index.js
```

### 构建项目

```bash
npm run build
```

### 运行测试

```bash
npm test
```

## 项目结构

```
claude-nvidia-proxy/
├── dist/              # 构建输出
├── src/               # 源代码
│   ├── index.js      # 主入口文件
│   ├── cli/          # CLI 入口
│   ├── config/       # 配置管理
│   ├── converter/    # 格式转换
│   ├── utils/        # 工具函数
│   ├── proxy/        # 代理处理
│   ├── server/       # HTTP 服务器
│   ├── test/         # 测试文件
│   └── origin/       # 原始文件
├── examples/         # 示例代码
├── build.js          # 构建脚本
├── package.json      # 项目配置
├── README.md         # 项目文档
├── CONTRIBUTING.md   # 贡献指南（本文件）
├── LICENSE           # 许可证
├── .env.example      # 环境变量示例
└── .gitignore        # Git 忽略文件
```

## 测试指南

### 单元测试

```bash
npm test
```

### 集成测试

```bash
npm run test:integration
```

### 手动测试

使用 curl 或 Postman 测试 API：

```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{
    "model": "meta/llama-3.1-405b-instruct",
    "max_tokens": 100,
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## 文档贡献

### 更新文档

- 保持文档简洁明了
- 使用代码示例
- 更新相关部分
- 检查拼写和语法

### 添加示例

在 `examples/` 目录中添加新的使用示例：

```javascript
// examples/new-feature.js
import { createProxy } from 'claude-nvidia-proxy';

async function example() {
  // 你的示例代码
}

export { example };
```

## 发布流程

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 发布到 npm
5. 发布 Docker 镜像
6. 创建 GitHub Release

## 行为准则

- 尊重所有贡献者
- 欢迎建设性的批评
- 关注对社区最有利的事情
- 对不同观点保持开放态度

## 获取帮助

如果你有任何问题：

1. 查看 [文档](README.md)
2. 搜索 [Issues](https://github.com/hexoh/claude-nvidia-proxy/issues)
3. 在 [Discussions](https://github.com/hexoh/claude-nvidia-proxy/discussions) 中提问
4. 联系维护者

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

## 致谢

感谢所有贡献者！

---

再次感谢你的贡献！🎉