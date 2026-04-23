import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

const CONFIG_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const CONFIG_FILE = path.join(CONFIG_DIR, 'settings.json');
const MODELS_FILE = path.join(CONFIG_DIR, 'models.json');
const DEFAULT_MODELS_FILE = path.join(process.cwd(), 'config', 'models.json');

let config = {
  PROXY_URL: 'localhost:8888',
  API_BASE_URL: 'https://integrate.api.nvidia.com/v1/chat/completions',
  NV_API_KEY: '',
  SERVER_API_KEY: 'your-secret-key',
  TIMEOUT: 300000,
  LOG_BODY_MAX: 4096,
  LOG_STREAM_PREVIEW_MAX: 256
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
  ensureModelsFile();
}

function getModelsPath() {
  return MODELS_FILE;
}

function ensureModelsFile() {
  if (!fs.existsSync(MODELS_FILE)) {
    if (fs.existsSync(DEFAULT_MODELS_FILE)) {
      fs.copyFileSync(DEFAULT_MODELS_FILE, MODELS_FILE);
    } else {
      fs.writeFileSync(MODELS_FILE, JSON.stringify([
        "z-ai/glm4.7",
        "minimaxai/minimax-m2.7"
      ], null, 2), 'utf-8');
    }
  }
}

function readModelsFile() {
  ensureModelsFile();
  const content = fs.readFileSync(MODELS_FILE, 'utf-8');
  return JSON.parse(content);
}

function writeModelsFile(models) {
  ensureModelsFile();
  fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2), 'utf-8');
}

function modelExists(modelName) {
  const models = readModelsFile();
  return models.includes(modelName);
}

function promptForConfig() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Only ask for NV_API_KEY, other parameters use default values
    const questions = [
      {
        key: 'NV_API_KEY',
        prompt: 'Enter NVIDIA API Key',
        default: '',
        required: true,
        password: true
      }
    ];

    const answers = {};
    let currentQuestion = 0;

    function askNext() {
      if (currentQuestion >= questions.length) {
        rl.close();

        // Set default values for other parameters
        resolve({
          ...answers,
          PROXY_URL: 'localhost:8888',
          API_BASE_URL: 'https://integrate.api.nvidia.com/v1/chat/completions',
          SERVER_API_KEY: '',
          TIMEOUT: 300000,
          LOG_BODY_MAX: 4096,
          LOG_STREAM_PREVIEW_MAX: 256
        });
        return;
      }

      const q = questions[currentQuestion];
      const promptText = `${q.prompt}: `;

      rl.question(promptText, (answer) => {
        const value = answer.trim() || q.default;

        if (q.required && !value) {
          console.log('This field is required, please re-enter.');
          askNext();
          return;
        }

        answers[q.key] = value;
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
    if (jsonConfig.PROXY_URL) merged.PROXY_URL = jsonConfig.PROXY_URL;
    if (jsonConfig.API_BASE_URL) merged.API_BASE_URL = jsonConfig.API_BASE_URL;
    if (jsonConfig.NV_API_KEY) merged.NV_API_KEY = jsonConfig.NV_API_KEY;
    if (jsonConfig.SERVER_API_KEY !== undefined) merged.SERVER_API_KEY = jsonConfig.SERVER_API_KEY;
    if (jsonConfig.TIMEOUT) merged.TIMEOUT = jsonConfig.TIMEOUT;
    if (jsonConfig.LOG_BODY_MAX !== undefined) merged.LOG_BODY_MAX = jsonConfig.LOG_BODY_MAX;
    if (jsonConfig.LOG_STREAM_PREVIEW_MAX !== undefined) merged.LOG_STREAM_PREVIEW_MAX = jsonConfig.LOG_STREAM_PREVIEW_MAX;
  }

  // Update environment variable name mappings
  const timeoutStr = (process.env.TIMEOUT || '').trim();
  if (timeoutStr) {
    const timeout = parseInt(timeoutStr, 10);
    if (!isNaN(timeout) && timeout > 0) {
      merged.TIMEOUT = timeout;
    }
  }

  const logBodyMaxStr = (process.env.LOG_BODY_MAX || '').trim();
  if (logBodyMaxStr) {
    const logBodyMax = parseInt(logBodyMaxStr, 10);
    if (!isNaN(logBodyMax) && logBodyMax >= 0) {
      merged.LOG_BODY_MAX = logBodyMax;
    }
  }

  const logStreamPreviewMaxStr = (process.env.LOG_STREAM_PREVIEW_MAX || '').trim();
  if (logStreamPreviewMaxStr) {
    const logStreamPreviewMax = parseInt(logStreamPreviewMaxStr, 10);
    if (!isNaN(logStreamPreviewMax) && logStreamPreviewMax >= 0) {
      merged.LOG_STREAM_PREVIEW_MAX = logStreamPreviewMax;
    }
  }

  if (process.env.API_BASE_URL) {
    merged.API_BASE_URL = process.env.API_BASE_URL.trim();
  }
  if (process.env.NV_API_KEY) {
    merged.NV_API_KEY = process.env.NV_API_KEY.trim();
  }
  if (process.env.SERVER_API_KEY) {
    merged.SERVER_API_KEY = process.env.SERVER_API_KEY.trim();
  }
  if (process.env.PROXY_URL) {
    merged.PROXY_URL = process.env.PROXY_URL.trim();
  }

  return merged;
}

function ensureConfig() {
  if (!configExists()) {
    console.log('Configuration file does not exist, starting interactive configuration...');
    console.log(`Configuration file will be created at: ${CONFIG_FILE}`);
    console.log('');

    const cfg = promptForConfig();
    writeConfigFile(cfg);

    console.log('');
    console.log(`Configuration file created: ${CONFIG_FILE}`);
    return cfg;
  }

  return readConfigFile();
}

function loadConfig() {
  const jsonConfig = ensureConfig();
  config = mergeConfig(jsonConfig);

  if (!config.API_BASE_URL) {
    throw new Error('missing API_BASE_URL in config or environment');
  }
  if (!config.NV_API_KEY) {
    throw new Error('missing NV_API_KEY in config or environment');
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
  ensureConfig,
  getModelsPath,
  ensureModelsFile,
  readModelsFile,
  writeModelsFile,
  modelExists
};
