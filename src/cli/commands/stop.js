import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../../logger/index.js';

const PID_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const PID_FILE = path.join(PID_DIR, 'proxy.pid');

export async function stopCommand() {
  const logger = getLogger();

  try {
    if (!fs.existsSync(PID_FILE)) {
      logger.logError('服务未运行');
      process.exit(1);
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));

    try {
      process.kill(pid, 0);
    } catch (e) {
      logger.logError('服务未运行');
      fs.unlinkSync(PID_FILE);
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
        fs.unlinkSync(PID_FILE);
        logger.logInfo('服务已停止');
        process.exit(0);
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logger.logError('停止服务超时，尝试强制终止');
    process.kill(pid, 'SIGKILL');
    fs.unlinkSync(PID_FILE);
    logger.logInfo('服务已强制停止');
    process.exit(0);

  } catch (err) {
    logger.logError(`停止服务失败: ${err.message}`);
    process.exit(1);
  }
}
