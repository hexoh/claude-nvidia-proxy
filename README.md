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

### 1. 首次配置

首次使用前，需要运行配置命令：

```bash
cnp config
```

这将启动交互式配置向导，引导你设置必要的配置项。配置文件将保存在 `~/.claude-nvidia-proxy/setting.json`。

### 2. 启动服务

```bash
cnp start
```

### 3. 其他命令

```bash
# 停止服务
cnp stop

# 重启服务
cnp restart

# 查看服务状态
cnp status

# 查看日志
cnp logs

# 实时跟踪日志
cnp logs --tail

# 查看最近 100 行日志
cnp logs --lines=100

# 只查看错误日志
cnp logs --error

# 只查看访问日志
cnp logs --access
```

### 4. 作为 npm 包在代码中使用

```javascript
import { main } from 'claude-nvidia-proxy';

// 直接启动服务
main();
```

### 5. 全局安装使用

```bash
# 全局安装
npm install -g claude-nvidia-proxy

# 启动服务
cnp start
```

## 配置

### 配置文件

配置文件位置：`~/.claude-nvidia-proxy/setting.json`

配置文件格式：

```json
{
  "addr": "localhost:8888",
  "upstreamURL": "https://integrate.api.nvidia.com/v1/chat/completions",
  "providerAPIKey": "your-nvidia-api-key",
  "serverAPIKey": "your-secret-key",
  "timeout": 300000,
  "logBodyMax": 4096,
  "logStreamPreviewMax": 256
}
```

### 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `addr` | 服务器监听地址 | `localhost:8888` |
| `upstreamURL` | NVIDIA API 地址 | 必填 |
| `providerAPIKey` | NVIDIA API 密钥 | 必填 |
| `serverAPIKey` | 服务器认证密钥 | 可选 |
| `timeout` | 上游请求超时时间（毫秒） | `300000` |
| `logBodyMax` | 日志最大字符数 | `4096` |
| `logStreamPreviewMax` | 流式响应预览字符数 | `256` |

### 环境变量

环境变量可以覆盖配置文件中的设置（优先级更高）：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ADDR` | 服务器监听地址 | 配置文件中的值 |
| `UPSTREAM_URL` | NVIDIA API 地址 | 配置文件中的值 |
| `PROVIDER_API_KEY` | NVIDIA API 密钥 | 配置文件中的值 |
| `SERVER_API_KEY` | 服务器认证密钥 | 配置文件中的值 |
| `UPSTREAM_TIMEOUT_SECONDS` | 上游请求超时时间（秒） | 配置文件中的值 |
| `LOG_BODY_MAX_CHARS` | 日志最大字符数 | 配置文件中的值 |
| `LOG_STREAM_TEXT_PREVIEW_CHARS` | 流式响应预览字符数 | 配置文件中的值 |

### 日志系统

日志文件位置：`~/.claude-nvidia-proxy/logs/`

日志文件类型：
- `proxy-YYYY-MM-DD.log` - 主日志文件
- `error-YYYY-MM-DD.log` - 错误日志文件
- `access-YYYY-MM-DD.log` - 访问日志文件

日志特性：
- 按日期分割日志文件
- 单个日志文件最大 10MB，超过时自动创建新文件
- 自动清理 7 天前的旧日志
- 同时输出到控制台和文件

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
├── src/
│   ├── cli/
│   │   ├── index.js              # CLI 入口
│   │   └── commands/
│   │       ├── start.js          # 启动命令
│   │       ├── stop.js           # 停止命令
│   │       ├── restart.js        # 重启命令
│   │       ├── config.js         # 配置命令
│   │       ├── status.js         # 状态命令
│   │       └── logs.js           # 日志命令
│   ├── config/
│   │   └── index.js              # 配置管理
│   ├── logger/
│   │   └── index.js              # 日志管理
│   ├── server/
│   │   └── index.js              # HTTP 服务器
│   ├── proxy/
│   │   └── index.js              # 代理逻辑
│   ├── converter/
│   │   └── index.js              # 格式转换
│   ├── utils/
│   │   └── index.js              # 工具函数
│   └── index.js                  # 主入口
├── config.example.json           # 配置示例
├── dist/                         # 构建输出
├── examples/                     # 示例代码
├── build.js                      # 构建脚本
├── package.json                  # 项目配置
├── README.md                     # 项目文档
├── CONTRIBUTING.md               # 贡献指南
├── CHANGELOG.md                  # 变更日志
├── SECURITY.md                   # 安全政策
└── LICENSE                       # MIT 许可证
```

## 用户目录结构

```
~/.claude-nvidia-proxy/
├── setting.json                  # 配置文件
├── proxy.pid                     # PID 文件
└── logs/                         # 日志目录
    ├── proxy-YYYY-MM-DD.log
    ├── error-YYYY-MM-DD.log
    └── access-YYYY-MM-DD.log
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

## 故障排查

### 服务无法启动

1. 检查配置文件是否存在：
   ```bash
   cnp status
   ```

2. 如果配置文件不存在，运行配置命令：
   ```bash
   cnp config
   ```

3. 检查端口是否被占用：
   ```bash
   # macOS/Linux
   lsof -i :8888

   # Windows
   netstat -ano | findstr :8888
   ```

4. 查看错误日志：
   ```bash
   cnp logs --error
   ```

### 查看日志

```bash
# 查看最近的日志
cnp logs

# 实时跟踪日志
cnp logs --tail

# 查看错误日志
cnp logs --error
```

### 重置配置

如果需要重新配置，可以：

1. 删除配置文件：
   ```bash
   rm ~/.claude-nvidia-proxy/setting.json
   ```

2. 重新运行配置命令：
   ```bash
   cnp config
   ```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！详见 [CONTRIBUTING.md](CONTRIBUTING.md)