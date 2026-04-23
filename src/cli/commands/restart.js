import { getLogger } from '../../logger/index.js';
import { stopCommand } from './stop.js';
import { startCommand } from './start.js';

export async function restartCommand() {
  const logger = getLogger();

  try {
    logger.logInfo('Stopping service...');
    await stopCommand();

    logger.logInfo('Waiting for service to fully stop...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    logger.logInfo('Starting service...');
    await startCommand();

  } catch (err) {
    logger.logError(`Failed to restart service: ${err.message}`);
    process.exit(1);
  }
}
