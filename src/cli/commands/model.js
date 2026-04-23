import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { getLogger } from '../../logger/index.js';
import { readConfigFile, readModelsFile, writeModelsFile, modelExists, getConfigPath } from '../../config/index.js';
import { startCommand } from './start.js';
import { restartCommand } from './restart.js';
import { keySelect } from '../utils.js';

const CONFIG_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const CLAUDE_BACKUP_FILE = path.join(CLAUDE_DIR, 'settings.json.claude-nvidia-proxy.bak');
const CLAUDE_PROXY_SETTINGS_FILE = path.join(CONFIG_DIR, 'claude.settings.json');

const PID_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const PID_FILE = path.join(PID_DIR, 'proxy.pid');

function isServiceRunning() {
  if (!fs.existsSync(PID_FILE)) {
    return false;
  }
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

export async function modelListCommand() {
  const logger = getLogger();

  try {
    const models = readModelsFile();

    console.log('Available models:');
    console.log('');
    
    if (models.length === 0) {
      console.log('  No models available.');
      return;
    }

    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model}`);
    });

    console.log('');
    console.log(`Total: ${models.length} model(s)`);

  } catch (err) {
    logger.logError(`Failed to list models: ${err.message}`);
    process.exit(1);
  }
}

export async function modelAddCommand(modelName) {
  const logger = getLogger();

  try {
    if (!modelName) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      modelName = await new Promise(resolve => {
        rl.question('Enter NVIDIA model name (e.g., z-ai/glm4.7): ', resolve);
      });
      rl.close();

      modelName = modelName.trim();
      if (!modelName) {
        logger.logError('Model name is required');
        process.exit(1);
      }
    }

    if (modelExists(modelName)) {
      logger.logError(`Model already exists: ${modelName}`);
      process.exit(1);
    }

    const models = readModelsFile();
    models.push(modelName);
    writeModelsFile(models);

    logger.logInfo(`Model added successfully: ${modelName}`);

  } catch (err) {
    logger.logError(`Failed to add model: ${err.message}`);
    process.exit(1);
  }
}

export async function modelRmCommand(modelIdentifier) {
  const logger = getLogger();

  try {
    if (!modelIdentifier) {
      logger.logError('Model identifier is required (use model name or index)');
      process.exit(1);
    }

    const models = readModelsFile();

    if (models.length === 1) {
      logger.logError('Cannot remove the last model');
      process.exit(1);
    }

    let indexToRemove = -1;

    const index = parseInt(modelIdentifier);
    if (!isNaN(index)) {
      if (index < 1 || index > models.length) {
        logger.logError(`Invalid model index: ${index}`);
        process.exit(1);
      }
      indexToRemove = index - 1;
    } else {
      indexToRemove = models.indexOf(modelIdentifier);
      if (indexToRemove === -1) {
        logger.logError(`Model not found: ${modelIdentifier}`);
        process.exit(1);
      }
    }

    const removedModel = models[indexToRemove];
    models.splice(indexToRemove, 1);
    writeModelsFile(models);

    logger.logInfo(`Model removed successfully: ${removedModel}`);

  } catch (err) {
    logger.logError(`Failed to remove model: ${err.message}`);
    process.exit(1);
  }
}

async function promptForModelSelection(models, modelName, defaultValue) {
  const items = models.map(model => {
    const defaultMark = model === defaultValue ? ' (default)' : '';
    return `${model}${defaultMark}`;
  });

  const selected = await keySelect({
    items,
    title: `Select model for ${modelName}`
  });

  return selected.replace(' (default)', '');
}

export async function modelSetupCommand() {
  const logger = getLogger();

  try {
    console.log('=== Claude Code Model Configuration ===\n');

    if (!fs.existsSync(getConfigPath())) {
      logger.logError('Configuration file does not exist. Please run: cnp config');
      process.exit(1);
    }

    const config = readConfigFile();
    const models = readModelsFile();

    if (!models || models.length === 0) {
      logger.logError('No models available. Please add models first using: cnp model add');
      process.exit(1);
    }

    console.log(`Found ${models.length} available models:`);
    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model}`);
    });

    const haikuModel = await promptForModelSelection(models, 'ANTHROPIC_DEFAULT_HAIKU_MODEL', models[0]);
    const sonnetModel = await promptForModelSelection(models, 'ANTHROPIC_DEFAULT_SONNET_MODEL', models[0]);
    const opusModel = await promptForModelSelection(models, 'ANTHROPIC_DEFAULT_OPUS_MODEL', models[0]);

    const proxyUrl = config.PROXY_URL.startsWith('http') ? config.PROXY_URL : `http://${config.PROXY_URL}`;
    const timeout = config.TIMEOUT || 300000;

    const claudeSettings = {
      env: {
        ANTHROPIC_AUTH_TOKEN: config.SERVER_API_KEY || '',
        ANTHROPIC_BASE_URL: proxyUrl,
        API_TIMEOUT_MS: timeout.toString(),
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: haikuModel,
        ANTHROPIC_DEFAULT_SONNET_MODEL: sonnetModel,
        ANTHROPIC_DEFAULT_OPUS_MODEL: opusModel
      },
      includeCoAuthoredBy: false
    };

    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    fs.writeFileSync(CLAUDE_PROXY_SETTINGS_FILE, JSON.stringify(claudeSettings, null, 2), 'utf-8');
    logger.logInfo(`Claude settings saved to: ${CLAUDE_PROXY_SETTINGS_FILE}`);

    if (!fs.existsSync(CLAUDE_DIR)) {
      fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    }

    if (!fs.existsSync(CLAUDE_BACKUP_FILE) && fs.existsSync(CLAUDE_SETTINGS_FILE)) {
      fs.copyFileSync(CLAUDE_SETTINGS_FILE, CLAUDE_BACKUP_FILE);
      logger.logInfo(`Original Claude settings backed up to: ${CLAUDE_BACKUP_FILE}`);
    }

    fs.copyFileSync(CLAUDE_PROXY_SETTINGS_FILE, CLAUDE_SETTINGS_FILE);
    logger.logInfo(`Claude settings installed to: ${CLAUDE_SETTINGS_FILE}`);

    /* const wasRunning = isServiceRunning();

    if (wasRunning) {
      logger.logInfo('Service is running, restarting...');
      await restartCommand();
    } else {
      logger.logInfo('Service is not running, starting...');
      await startCommand();
    } */

    console.log('\n========================================');
    console.log('Model configuration complete:');
    console.log(`  ANTHROPIC_DEFAULT_HAIKU_MODEL  -> ${haikuModel}`);
    console.log(`  ANTHROPIC_DEFAULT_SONNET_MODEL -> ${sonnetModel}`);
    console.log(`  ANTHROPIC_DEFAULT_OPUS_MODEL    -> ${opusModel}`);
    console.log('========================================');
    console.log('Please start or restart Claude Code to apply the configuration.');
    console.log('========================================\n');

    process.exit(0);

  } catch (err) {
    logger.logError(`Setup failed: ${err.message}`);
    process.exit(1);
  }
}

export async function modelHelpCommand() {
  console.log('Claude NVIDIA Proxy - Model Management');
  console.log('');
  console.log('Usage: cnp model <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  list    List available models');
  console.log('  add     Add a new model');
  console.log('  rm      Remove a model');
  console.log('  setup   Setup Claude Code model configuration');
  console.log('');
  console.log('Examples:');
  console.log('  cnp model list');
  console.log('  cnp model add z-ai/glm4.7');
  console.log('  cnp model rm z-ai/glm4.7');
  console.log('  cnp model rm 1');
  console.log('  cnp model setup');
  console.log('');
  console.log('For more information, visit: https://github.com/hexoh/claude-nvidia-proxy');
}