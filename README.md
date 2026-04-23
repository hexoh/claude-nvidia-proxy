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

A proxy server that converts Anthropic API requests to NVIDIA API requests.

English | [中文](README.zh.md) | [Changelog](CHANGELOG.md)

</div>

## Features

- Convert Anthropic API format to OpenAI/NVIDIA API format
- Support streaming and non-streaming responses
- Support tool calls
- Support image input
- Complete token usage statistics
- Simple authentication

## Installation

### As npm package (recommended)

```bash
npm install -g claude-nvidia-proxy
```

### From GitHub Release

* Download the release from [GitHub Releases](https://github.com/hexoh/claude-nvidia-proxy/releases)
* Extract the file
* Run:

```bash
# If using dist folder
node dist/cli/index.js start

# If using source, first build
npm install
npm run build
node dist/cli/index.js start
```

## Usage

### Quick Start

```bash
cnp start
```

If no configuration exists, the service will automatically prompt you to configure:

```
? Configuration file does not exist. Do you want to configure now? (y/N): y
? Enter NVIDIA API Key: nvapi-xxxxxxxxxxxxxxxx
listening on localhost:8888
```

**Complete Setup Guide:**

1. **Start service** (auto-configure if needed):
   ```bash
   cnp start
   ```

2. **Configure Claude Code models** (recommended):
   ```bash
   cnp model setup
   ```
   
   This will guide you to select models for HAIKU, SONNET, and OPUS:
   
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
   
   =========================================
   Model configuration complete:
     ANTHROPIC_DEFAULT_HAIKU_MODEL  -> z-ai/glm4.7
     ANTHROPIC_DEFAULT_SONNET_MODEL -> minimaxai/minimax-m2.7
     ANTHROPIC_DEFAULT_OPUS_MODEL    -> z-ai/glm4.7
   ========================================
   Please start or restart Claude Code to apply the configuration.
   ```
   
   This command will:
   - Backup your existing Claude Code config
   - Auto-configure the three model tiers (HAIKU, SONNET, OPUS)
   - Install config to `~/.claude/settings.json`
   - Auto-start or restart the proxy service

3. **Restart Claude Code** to use the new configuration.

**Note:**

### Other Commands

- `cnp config` - Configure or reconfigure the proxy (requires NVIDIA API Key)
- `cnp start` - Start the proxy service
- `cnp stop` - Stop the proxy service
- `cnp restart` - Restart the proxy service
- `cnp status` - View service status
- `cnp logs` - View recent logs
- `cnp logs --tail` - Follow logs in real-time
- `cnp logs --lines=100` - View last N lines
- `cnp logs --error` - View error logs only
- `cnp logs --access` - View access logs only
- `cnp model list` - List available models
- `cnp model add <model>` - Add a new model (e.g., `cnp model add z-ai/glm4.7`)
- `cnp model rm <model>` - Remove a model (by name or index)
- `cnp model setup` - Configure Claude Code model tiers (HAIKU, SONNET, OPUS)
- `cnp test` - Test all available models
- `cnp test <model>` - Test a specific model

## Configuration

### Config File

| OS | Location |
|--------|-------------|
| Windows | `C:\Users\<username>\.claude-nvidia-proxy\settings.json` |
| macOS / Linux | `~/.claude-nvidia-proxy/settings.json` |

Format:

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

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `PROXY_URL` | Server listen address | `localhost:8888` |
| `API_BASE_URL` | NVIDIA API address | Required |
| `NV_API_KEY` | NVIDIA API key | Required |
| `SERVER_API_KEY` | Server auth key | Optional |
| `TIMEOUT` | Upstream request timeout (ms) | `300000` |
| `LOG_BODY_MAX` | Max log characters | `4096` |
| `LOG_STREAM_PREVIEW_MAX` | Stream preview characters | `256` |

### Environment Variables

Environment variables can override config file settings (higher priority):

| Variable | Description | Default |
|----------|-------------|---------|
| `PROXY_URL` | Server listen address | Config value |
| `API_BASE_URL` | NVIDIA API address | Config value |
| `NV_API_KEY` | NVIDIA API key | Config value |
| `SERVER_API_KEY` | Server auth key | Config value |
| `TIMEOUT` | Upstream timeout (ms) | Config value |
| `LOG_BODY_MAX` | Max log characters | Config value |
| `LOG_STREAM_PREVIEW_MAX` | Stream preview chars | Config value |

### Log System

| OS | Log Location |
|--------|-------------|
| Windows | `C:\Users\<username>\.claude-nvidia-proxy\logs\` |
| macOS / Linux | `~/.claude-nvidia-proxy/logs/` |

Log types:
- `proxy-YYYY-MM-DD.log` - Main log
- `error-YYYY-MM-DD.log` - Error log
- `access-YYYY-MM-DD.log` - Access log

Features:
- Daily log rotation
- Max 10MB per file, creates new file when exceeded
- Auto-clean logs older than 7 days
- Output to both console and file

## API Usage

### Request Format

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

### Supported Models

- `z-ai/glm4.7`
- `minimaxai/minimax-m2.7`

## Claude Code Configuration

### Using model setup command

Recommended to use `model setup` command to automatically configure Claude Code:

```bash
cnp model setup
```

This command will:
1. Read available models (from `~/.claude-nvidia-proxy/models.json`)
2. Guide you to select three models (HAIKU, SONNET, OPUS)
3. Auto-generate Claude Code config file
4. Backup original Claude Code config (if exists)
5. Install new config to `~/.claude/settings.json`
6. Auto-start or restart proxy service
7. Show model configuration mapping
8. Prompt you to restart Claude Code

### Model Management

Before using `model setup`, manage the available models:

- `cnp model list` - List available models
- `cnp model add <model>` - Add a new model (e.g., `cnp model add z-ai/glm4.7`)
- `cnp model rm <model>` - Remove a model (by name or index, e.g., `cnp model rm z-ai/glm4.7` or `cnp model rm 1`)

**Notes:**
- When adding, if model exists, shows "Model already exists"
- When removing, if only one model left, shows "Cannot remove the last model"
- Can use model name or index to remove

### Manual Configuration

To manually configure, create `~/.claude/settings.json`:

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

Configuration notes:
- `ANTHROPIC_AUTH_TOKEN`: Use `SERVER_API_KEY` from your config
- `ANTHROPIC_BASE_URL`: Use `PROXY_URL` from your config (include `http://` or `https://`)
- `API_TIMEOUT_MS`: Use `TIMEOUT` from your config (in milliseconds)
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`: Model selected from `models.json`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`: Model selected from `models.json`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`: Model selected from `models.json`

### Model Configuration

Available models are stored in `~/.claude-nvidia-proxy/models.json`

Default models:
```json
[
  "z-ai/glm4.7",
  "minimaxai/minimax-m2.7"
]
```

Use `cnp model add` and `cnp model rm` to manage available models.

## Troubleshooting

### Service won't start

1. Check if config exists:
   ```bash
   cnp status
   ```

2. If no config, run config command:
   ```bash
   cnp config
   ```

3. Check if port is in use:
   ```bash
   # macOS/Linux
   lsof -i :8888

   # Windows
   netstat -ano | findstr :8888
   ```

4. Check error logs:
   ```bash
   cnp logs --error
   ```

### View Logs

```bash
# View recent logs
cnp logs

# Follow logs
cnp logs --tail

# View error logs
cnp logs --error
```

### Reset Configuration

If you need to reconfigure:

1. Delete config:
   ```bash
   rm ~/.claude-nvidia-proxy/settings.json
   ```

2. Run config command:
   ```bash
   cnp config
   ```

### Reset Claude Code Configuration

To reset Claude Code config:

1. Stop service (auto-restores original):
   ```bash
   cnp stop
   ```

2. Or manually delete backup and re-setup:
   ```bash
   rm ~/.claude/settings.json.claude-nvidia-proxy.bak
   cnp model setup
   ```

## License

MIT

## Contributing

Issues and Pull Requests are welcome! See [CONTRIBUTING.md](.github/CONTRIBUTING.md)