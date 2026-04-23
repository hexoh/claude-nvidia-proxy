import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../../logger/index.js';

const PID_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const PID_FILE = path.join(PID_DIR, 'proxy.pid');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');
const CLAUDE_BACKUP_FILE = path.join(CLAUDE_DIR, 'settings.json.claude-nvidia-proxy.bak');

export async function stopCommand() {
  const logger = getLogger();

  try {
    if (!fs.existsSync(PID_FILE)) {
      logger.logError('Service is not running');
      process.exit(1);
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));

    try {
      process.kill(pid, 0);
    } catch (e) {
      logger.logError('Service is not running');
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
      process.exit(1);
    }

    process.kill(pid, 'SIGTERM');

    let attempts = 0;
    const maxAttempts = 10;

    const checkStopped = () => {
      return new Promise((resolve) => {
        try {
          process.kill(pid, 0);
          resolve(false);
        } catch (e) {
          resolve(true);
        }
      });
    };

    while (attempts < maxAttempts) {
      const stopped = await checkStopped();
      if (stopped) {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
        
        if (fs.existsSync(CLAUDE_BACKUP_FILE)) {
          fs.copyFileSync(CLAUDE_BACKUP_FILE, CLAUDE_SETTINGS_FILE);
          fs.unlinkSync(CLAUDE_BACKUP_FILE);
          logger.logInfo('Original Claude settings restored');
        }
        
        logger.logInfo('Service stopped');
        process.exit(0);
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.logError('Timeout stopping service, attempting force kill');
    process.kill(pid, 'SIGKILL');
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    
    if (fs.existsSync(CLAUDE_BACKUP_FILE)) {
      fs.copyFileSync(CLAUDE_BACKUP_FILE, CLAUDE_SETTINGS_FILE);
      fs.unlinkSync(CLAUDE_BACKUP_FILE);
      logger.logInfo('Original Claude settings restored');
    }
    
    logger.logInfo('Service force stopped');
    process.exit(0);

  } catch (err) {
    logger.logError(`Failed to stop service: ${err.message}`);
    process.exit(1);
  }
}
