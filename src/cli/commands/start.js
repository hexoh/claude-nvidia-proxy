import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { loadConfig, getConfigPath, promptForConfig, writeConfigFile } from '../../config/index.js';
import { createServer } from '../../server/index.js';
import { getLogger, checkPortAvailable } from '../../logger/index.js';

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

    const cfg = loadConfig();
    const [host, port] = cfg.PROXY_URL.split(':');

    const portAvailable = await checkPortAvailable(parseInt(port), host);
    if (!portAvailable) {
      logger.logError(`Port ${port} is already in use`);
      process.exit(1);
    }

    const server = createServer(cfg);

    if (!fs.existsSync(PID_DIR)) {
      fs.mkdirSync(PID_DIR, { recursive: true });
    }
    fs.writeFileSync(PID_FILE, process.pid.toString());

    logger.logInfo(`listening on ${cfg.PROXY_URL}`);
    logger.logInfo(`upstream: ${cfg.API_BASE_URL}`);

    server.listen(parseInt(port), host);

    process.on('SIGTERM', () => {
      logger.logInfo('Received SIGTERM, shutting down...');
      server.close(() => {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.logInfo('Received SIGINT, shutting down...');
      server.close(() => {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
        process.exit(0);
      });
    });

  } catch (err) {
    logger.logError(`Failed to start service: ${err.message}`);
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    process.exit(1);
  }
}
