import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { getConfigPath, promptForConfig, writeConfigFile } from '../../config/index.js';
import { getLogger } from '../../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PID_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const PID_FILE = path.join(PID_DIR, 'proxy.pid');

export async function startCommand() {
  const logger = getLogger();

  try {
    if (!fs.existsSync(getConfigPath())) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Configuration file does not exist. Do you want to configure now? (y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'y') {
        logger.logInfo('Starting interactive configuration...');
        logger.logInfo(`Configuration file will be created at: ${getConfigPath()}`);
        console.log('');

        const cfg = await promptForConfig();
        writeConfigFile(cfg);

        console.log('');
        logger.logInfo('Configuration completed successfully');
      } else {
        logger.logError('Configuration file does not exist. Please run: cnp config');
        process.exit(1);
      }
    }

    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
      try {
        process.kill(pid, 0);
        logger.logError(`Service is already running (PID: ${pid})`);
        process.exit(1);
      } catch (e) {
        fs.unlinkSync(PID_FILE);
      }
    }

    const cliPath = path.join(__dirname, '../../cli/index.js');
    const startProcess = spawn('node', [cliPath, '--serve'], {
      detached: true,
      stdio: 'ignore',
    });

    startProcess.on('error', (error) => {
      logger.logError(`Failed to start service: ${error.message}`);
      process.exit(1);
    });

    startProcess.unref();

    logger.logInfo('Service started in background');

    if (!fs.existsSync(PID_DIR)) {
      fs.mkdirSync(PID_DIR, { recursive: true });
    }

    let pidFound = false;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (fs.existsSync(PID_FILE)) {
        pidFound = true;
        break;
      }
    }

    if (pidFound) {
      console.log('Service started successfully');
    } else {
      console.log('Service startup timeout, please check logs with: cnp logs');
    }

    process.exit(0);

  } catch (err) {
    logger.logError(`Failed to start service: ${err.message}`);
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    process.exit(1);
  }
}
