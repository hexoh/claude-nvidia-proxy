# Claude-NVIDIA-Proxy

一个将 Anthropic API 请求转换为 NVIDIA API 请求的代理服务器。

## 功能特性

- 将 Anthropic API 格式转换为 OpenAI/NVIDIA API 格式
- 支持流式和非流式响应
- 支持工具调用（Tool Calls）
- 支持图片输入
- 完整的 token 使用统计
- 简单的认证机制

## 安装

### 作为 npm 包使用

```bash
npm install claude-nvidia-proxy
```

### 从源码安装

```bash
git clone https://github.com/yourusername/claude-nvidia-proxy.git
cd claude-nvidia-proxy
npm install
```

## 使用方法

### 1. 作为独立服务器运行

```bash
# 使用默认配置
npm start

# 或使用环境变量配置
UPSTREAM_URL=https://integrate.api.nvidia.com/v1/chat/completions \
PROVIDER_API_KEY=your-nvidia-api-key \
SERVER_API_KEY=your-secret-key \
npm start
```

### 2. 作为 npm 包在代码中使用

```javascript
import { main } from 'claude-nvidia-proxy';

// 直接启动服务
main();
```

### 3. 全局安装使用

```bash
# 全局安装
npm install -g claude-nvidia-proxy

# 启动服务
claude-nvidia-proxy
```

## 配置

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ADDR` | 服务器监听地址 | `localhost:3000` |
| `UPSTREAM_URL` | NVIDIA API 地址 | 必填 |
| `PROVIDER_API_KEY` | NVIDIA API 密钥 | 必填 |
| `SERVER_API_KEY` | 服务器认证密钥 | 可选 |
| `UPSTREAM_TIMEOUT_SECONDS` | 上游请求超时时间（秒） | `300` |
| `LOG_BODY_MAX_CHARS` | 日志最大字符数 | `4096` |
| `LOG_STREAM_TEXT_PREVIEW_CHARS` | 流式响应预览字符数 | `256` |

### 配置文件

创建 `.env` 文件：

```env
ADDR=localhost:3000
UPSTREAM_URL=https://integrate.api.nvidia.com/v1/chat/completions
PROVIDER_API_KEY=your-nvidia-api-key
SERVER_API_KEY=your-secret-key
UPSTREAM_TIMEOUT_SECONDS=300
LOG_BODY_MAX_CHARS=4096
LOG_STREAM_TEXT_PREVIEW_CHARS=256
```

## API 使用

### 请求格式

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

### 支持的模型

- `meta/llama-3.1-405b-instruct`
- `meta/llama-3.1-70b-instruct`
- `meta/llama-3.1-8b-instruct`

## Claude Code 配置

在 Claude Code 中配置使用此代理：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-secret-key",
    "ANTHROPIC_BASE_URL": "http://localhost:3000",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "meta/llama-3.1-8b-instruct",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "meta/llama-3.1-70b-instruct",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "meta/llama-3.1-405b-instruct"
  }
}
```

## 项目结构

```
claude-nvidia-proxy/
├── .github/                    # GitHub 配置
│   ├── workflows/             # CI/CD 工作流
│   ├── ISSUE_TEMPLATE/        # Issue 模板
│   └── pull_request_template.md
├── dist/                      # 构建输出
├── examples/                  # 示例代码
├── service.js                 # 主服务源码
├── main.js                    # 入口文件
├── build.js                   # 构建脚本
├── package.json               # 项目配置
├── README.md                  # 项目文档
├── CONTRIBUTING.md            # 贡献指南
├── CHANGELOG.md               # 变更日志
├── SECURITY.md               # 安全政策
└── LICENSE                   # MIT 许可证
```

## 开发

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！详见 [CONTRIBUTING.md](CONTRIBUTING.md)