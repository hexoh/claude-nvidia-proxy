import { getLogger } from '../../logger/index.js';
import { stopCommand } from './stop.js';
import { startCommand } from './start.js';

export async function restartCommand() {
  const logger = getLogger();

  try {
    logger.logInfo('正在停止服务...');
    await stopCommand();

    logger.logInfo('等待服务完全停止...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.logInfo('正在启动服务...');
    await startCommand();

  } catch (err) {
    logger.logError(`重启服务失败: ${err.message}`);
    process.exit(1);
  }
}
