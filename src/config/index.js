import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

dotenv.config();

const CONFIG_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const CONFIG_FILE = path.join(CONFIG_DIR, 'setting.json');

let config = {
  addr: ':3001',
  upstreamURL: '',
  providerAPIKey: '',
  serverAPIKey: '',
  timeout: 5 * 60 * 1000,
  logBodyMax: 4096,
  logStreamPreviewMax: 256
};

function getConfigPath() {
  return CONFIG_FILE;
}

function configExists() {
  return fs.existsSync(CONFIG_FILE);
}

function createConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function promptForConfig() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const questions = [
      {
        key: 'upstreamURL',
        prompt: '请输入 NVIDIA API 地址',
        default: 'https://integrate.api.nvidia.com/v1/chat/completions',
        required: true
      },
      {
        key: 'providerAPIKey',
        prompt: '请输入 NVIDIA API 密钥',
        default: '',
        required: true,
        password: true
      },
      {
        key: 'serverAPIKey',
        prompt: '请输入服务器认证密钥 (可选，直接回车跳过)',
        default: '',
        required: false,
        password: true
      },
      {
        key: 'addr',
        prompt: '请输入监听地址',
        default: 'localhost:8888',
        required: false
      },
      {
        key: 'timeout',
        prompt: '请输入超时时间（秒）',
        default: '300',
        required: false
      },
      {
        key: 'logBodyMax',
        prompt: '请输入日志最大字符数',
        default: '4096',
        required: false
      },
      {
        key: 'logStreamPreviewMax',
        prompt: '请输入流式响应预览字符数',
        default: '256',
        required: false
      }
    ];

    const answers = {};
    let currentQuestion = 0;

    function askNext() {
      if (currentQuestion >= questions.length) {
        rl.close();
        resolve(answers);
        return;
      }

      const q = questions[currentQuestion];
      const defaultText = q.default ? ` [默认: ${q.default}]` : '';
      const promptText = `${q.prompt}${defaultText}: `;

      rl.question(promptText, (answer) => {
        const value = answer.trim() || q.default;

        if (q.required && !value) {
          console.log('此项为必填项，请重新输入。');
          askNext();
          return;
        }

        if (q.key === 'timeout' || q.key === 'logBodyMax' || q.key === 'logStreamPreviewMax') {
          const num = parseInt(value, 10);
          if (isNaN(num) || num <= 0) {
            console.log('请输入有效的数字。');
            askNext();
            return;
          }
          answers[q.key] = num;
        } else {
          answers[q.key] = value;
        }

        currentQuestion++;
        askNext();
      });
    }

    askNext();
  });
}

function writeConfigFile(cfg) {
  createConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  fs.chmodSync(CONFIG_FILE, 0o600);
}

function readConfigFile() {
  if (!configExists()) {
    return null;
  }
  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(content);
}

function mergeConfig(jsonConfig) {
  const merged = { ...config };

  if (jsonConfig) {
    if (jsonConfig.addr) merged.addr = jsonConfig.addr;
    if (jsonConfig.upstreamURL) merged.upstreamURL = jsonConfig.upstreamURL;
    if (jsonConfig.providerAPIKey) merged.providerAPIKey = jsonConfig.providerAPIKey;
    if (jsonConfig.serverAPIKey !== undefined) merged.serverAPIKey = jsonConfig.serverAPIKey;
    if (jsonConfig.timeout) merged.timeout = jsonConfig.timeout;
    if (jsonConfig.logBodyMax !== undefined) merged.logBodyMax = jsonConfig.logBodyMax;
    if (jsonConfig.logStreamPreviewMax !== undefined) merged.logStreamPreviewMax = jsonConfig.logStreamPreviewMax;
  }

  const timeoutStr = (process.env.UPSTREAM_TIMEOUT_SECONDS || '').trim();
  if (timeoutStr) {
    const seconds = parseInt(timeoutStr, 10);
    if (!isNaN(seconds) && seconds > 0) {
      merged.timeout = seconds * 1000;
    }
  }

  const logBodyMaxStr = (process.env.LOG_BODY_MAX_CHARS || '').trim();
  if (logBodyMaxStr) {
    const logBodyMax = parseInt(logBodyMaxStr, 10);
    if (!isNaN(logBodyMax) && logBodyMax >= 0) {
      merged.logBodyMax = logBodyMax;
    }
  }

  const logStreamPreviewMaxStr = (process.env.LOG_STREAM_TEXT_PREVIEW_CHARS || '').trim();
  if (logStreamPreviewMaxStr) {
    const logStreamPreviewMax = parseInt(logStreamPreviewMaxStr, 10);
    if (!isNaN(logStreamPreviewMax) && logStreamPreviewMax >= 0) {
      merged.logStreamPreviewMax = logStreamPreviewMax;
    }
  }

  if (process.env.UPSTREAM_URL) {
    merged.upstreamURL = process.env.UPSTREAM_URL.trim();
  }
  if (process.env.PROVIDER_API_KEY) {
    merged.providerAPIKey = process.env.PROVIDER_API_KEY.trim();
  }
  if (process.env.SERVER_API_KEY) {
    merged.serverAPIKey = process.env.SERVER_API_KEY.trim();
  }
  if (process.env.ADDR) {
    merged.addr = process.env.ADDR.trim();
  }

  return merged;
}

function ensureConfig() {
  if (!configExists()) {
    console.log('配置文件不存在，开始交互式配置...');
    console.log(`配置文件将创建在: ${CONFIG_FILE}`);
    console.log('');

    const cfg = promptForConfig();
    writeConfigFile(cfg);

    console.log('');
    console.log(`配置文件已创建: ${CONFIG_FILE}`);
    return cfg;
  }

  return readConfigFile();
}

function loadConfig() {
  const jsonConfig = ensureConfig();
  config = mergeConfig(jsonConfig);

  if (!config.upstreamURL) {
    throw new Error('missing UPSTREAM_URL in config or environment');
  }
  if (!config.providerAPIKey) {
    throw new Error('missing PROVIDER_API_KEY in config or environment');
  }

  return config;
}

function getConfig() {
  return config;
}

export {
  loadConfig,
  getConfig,
  getConfigPath,
  configExists,
  createConfigDir,
  promptForConfig,
  writeConfigFile,
  readConfigFile,
  mergeConfig,
  ensureConfig
};
