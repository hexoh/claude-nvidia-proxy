<div align="center">

# Claude-NVIDIA-Proxy

<a href="https://www.npmjs.com/package/claude-nvidia-proxy">
   <img src="https://img.shields.io/npm/v/claude-nvidia-proxy.svg" alt="npm version">
</a>
<a href="https://github.com/hexoh/claude-nvidia-proxy/releases">
   <img src="https://img.shields.io/github/v/release/hexoh/claude-nvidia-proxy.svg" alt="GitHub version">
</a>
<a href="https://github.com/hexoh/claude-nvidia-proxy/releases">
   <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg" alt="Platform">
</a>
<a href="https://github.com/hexoh/claude-nvidia-proxy/blob/main/LICENSE">
   <img src="https://img.shields.io/github/license/hexoh/claude-nvidia-proxy.svg" alt="license">
</a>

一个将 Anthropic API 请求转换为 NVIDIA API 请求的代理服务器。

[English](README.md) | 中文 | [Changelog](CHANGELOG.md)

</div>

## 功能特性

- 将 Anthropic API 格式转换为 OpenAI/NVIDIA API 格式
- 支持流式和非流式响应
- 支持工具调用
- 支持图片输入
- 完整的 token 使用统计
- 简单的认证机制

## 安装

### 作为 npm 包

```bash
npm install -g claude-nvidia-proxy
```

## 快速开始

```bash
cnp start
```

如果没有配置文件，服务会自动引导你进行配置：

```
? Configuration file does not exist. Do you want to configure now? (y/N): y
? Enter NVIDIA API Key: nvapi-xxxxxxxxxxxxxxxx
listening on localhost:8888
```

**完整配置指南：**

1. **启动服务**（如无配置会自动引导）：
   ```bash
   cnp start
   ```

2. **配置 Claude Code 模型**（推荐）：
   ```bash
   cnp model setup
   ```
   
   这将引导你分别为 HAIKU、SONNET 和 OPUS 选择模型：
   
   ```
   === Claude Code Model Configuration ===
   
   Found 2 available models:
     1. z-ai/glm4.7
     2. minimaxai/minimax-m2.7
   
   Available models for ANTHROPIC_DEFAULT_HAIKU_MODEL:
     1. z-ai/glm4.7 (default)
     2. minimaxai/minimax-m2.7
   Select model for ANTHROPIC_DEFAULT_HAIKU_MODEL [1-2, default: 1]: 1
   
   Available models for ANTHROPIC_DEFAULT_SONNET_MODEL:
     1. z-ai/glm4.7
     2. minimaxai/minimax-m2.7 (default)
   Select model for ANTHROPIC_DEFAULT_SONNET_MODEL [1-2, default: 2]: 2
   
   Available models for ANTHROPIC_DEFAULT_OPUS_MODEL:
     1. z-ai/glm4.7 (default)
     2. minimaxai/minimax-m2.7
   Select model for ANTHROPIC_DEFAULT_OPUS_MODEL [1-2, default: 1]: 1
   
   ========================================
   Model configuration complete:
     ANTHROPIC_DEFAULT_HAIKU_MODEL  -> z-ai/glm4.7
     ANTHROPIC_DEFAULT_SONNET_MODEL -> minimaxai/minimax-m2.7
     ANTHROPIC_DEFAULT_OPUS_MODEL    -> z-ai/glm4.7
   ========================================
   Please start or restart Claude Code to apply the configuration.
   ```
   
   此命令会：
   - 备份现有的 Claude Code 配置
   - 自动配置三个模型层级（HAIKU、SONNET、OPUS）
   - 安装配置到 `~/.claude/settings.json`
   - 自动启动或重启代理服务

3. **重启 Claude Code** 使配置生效。

### 其他命令

- `cnp config` - 配置或重新配置代理（需要 NVIDIA API Key）
- `cnp start` - 启动代理服务
- `cnp stop` - 停止代理服务
- `cnp restart` - 重启代理服务
- `cnp status` - 查看服务状态
- `cnp logs` - 查看最近日志
- `cnp logs --tail` - 实时跟踪日志
- `cnp logs --lines=100` - 查看最近 N 行日志
- `cnp logs --error` - 只查看错误日志
- `cnp logs --access` - 只查看访问日志
- `cnp model list` - 列出可用模型
- `cnp model add <model>` - 添加新模型（如：`cnp model add z-ai/glm4.7`）
- `cnp model rm <model>` - 删除模型（按名称或索引）
- `cnp model setup` - 配置 Claude Code 模型层级（HAIKU、SONNET、OPUS）
- `cnp test` - 测试所有可用模型
- `cnp test <model>` - 测试指定模型

## 配置

### 配置文件

| 操作系统 | 位置 |
|---------|------|
| Windows | `C:\Users\<username>\.claude-nvidia-proxy\settings.json` |
| macOS / Linux | `~/.claude-nvidia-proxy/settings.json` |

格式：

```json
{
  "PROXY_URL": "localhost:8888",
  "API_BASE_URL": "https://integrate.api.nvidia.com/v1/chat/completions",
  "NV_API_KEY": "your-nvidia-api-key",
  "SERVER_API_KEY": "your-secret-key",
  "TIMEOUT": 300000,
  "LOG_BODY_MAX": 4096,
  "LOG_STREAM_PREVIEW_MAX": 256
}
```

### 配置项

| 配置项 | 说明 | 默认值 |
|--------|-------------|---------|
| `PROXY_URL` | 服务器监听地址 | `localhost:8888` |
| `API_BASE_URL` | NVIDIA API 地址 | 必填 |
| `NV_API_KEY` | NVIDIA API 密钥 | 必填 |
| `SERVER_API_KEY` | 服务器认证密钥 | 可选 |
| `TIMEOUT` | 上游请求超时（毫秒） | `300000` |
| `LOG_BODY_MAX` | 日志最大字符数 | `4096` |
| `LOG_STREAM_PREVIEW_MAX` | 流预览字符数 | `256` |

### 环境变量

环境变量可覆盖配置文件（优先级更高）：

| 变量 | 说明 | 默认值 |
|----------|-------------|---------|
| `PROXY_URL` | 服务器监听地址 | 配置值 |
| `API_BASE_URL` | NVIDIA API 地址 | 配置值 |
| `NV_API_KEY` | NVIDIA API 密钥 | 配置值 |
| `SERVER_API_KEY` | 服务器认证密钥 | 配置值 |
| `TIMEOUT` | 上游超时（毫秒） | 配置值 |
| `LOG_BODY_MAX` | 日志最大字符数 | 配置值 |
| `LOG_STREAM_PREVIEW_MAX` | 流预览字符数 | 配置值 |

### 日志系统

| 操作系统 | 日志位置 |
|---------|-------------|
| Windows | `C:\Users\<username>\.claude-nvidia-proxy\logs\` |
| macOS / Linux | `~/.claude-nvidia-proxy/logs/` |

日志类型：
- `proxy-YYYY-MM-DD.log` - 主日志
- `error-YYYY-MM-DD.log` - 错误日志
- `access-YYYY-MM-DD.log` - 访问日志

特性：
- 按日期轮转
- 单文件最大 10MB
- 自动清理 7 天前的日志
- 同时输出到控制台和文件

## API 使用

### 请求格式

```bash
curl -X POST http://localhost:8888/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "z-ai/glm4.7",
    "max_tokens": 100,
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 支持的模型

- `z-ai/glm4.7`
- `minimaxai/minimax-m2.7`

## Claude Code 配置

### 使用 model setup 命令

推荐使用 `model setup` 命令自动配置 Claude Code：

```bash
cnp model setup
```

此命令会：
1. 读取可用模型列表（从 `~/.claude-nvidia-proxy/models.json`）
2. 引导选择三个模型（HAIKU、SONNET、OPUS）
3. 自动生成 Claude Code 配置文件
4. 备份原有配置（如存在）
5. 安装新配置到 `~/.claude/settings.json`
6. 自动启动或重启代理服务
7. 显示模型配置映射
8. 提示重启 Claude Code

### 模型管理

使用 `model setup` 前可管理模型列表：

- `cnp model list` - 列出可用模型
- `cnp model add <model>` - 添加新模型（如：`cnp model add z-ai/glm4.7`）
- `cnp model rm <model>` - 删除模型（按名称或索引，如 `cnp model rm z-ai/glm4.7` 或 `cnp model rm 1`）

**注意：**
- 添加时如已存在会提示 "Model already exists"
- 删除时如只剩一个会提示 "Cannot remove the last model"

### 手动配置

手动创建 `~/.claude/settings.json`：

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-secret-key",
    "ANTHROPIC_BASE_URL": "http://localhost:8888",
    "API_TIMEOUT_MS": "300000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "z-ai/glm4.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "z-ai/glm4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "z-ai/glm4.7"
  },
  "includeCoAuthoredBy": false
}
```

### 模型配置

可用模型存储在 `~/.claude-nvidia-proxy/models.json`

默认模型：
```json
["z-ai/glm4.7", "minimaxai/minimax-m2.7"]
```

## 故障排查

### 服务无法启动

1. 检查配置是否存在：
   ```bash
   cnp status
   ```

2. 运行配置命令：
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

### 重置配置

```bash
rm ~/.claude-nvidia-proxy/settings.json
cnp config
```

### 重置 Claude Code 配置

```bash
cnp stop
# 或手动删除备份后重新配置
rm ~/.claude/settings.json.claude-nvidia-proxy.bak
cnp model setup
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！详见 [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)