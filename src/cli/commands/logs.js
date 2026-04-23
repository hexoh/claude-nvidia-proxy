import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../../logger/index.js';

const LOG_DIR = path.join(os.homedir(), '.claude-nvidia-proxy', 'logs');

export async function logsCommand(args) {
  const logger = getLogger();

  try {
    if (!fs.existsSync(LOG_DIR)) {
      logger.logError('Log directory does not exist');
      process.exit(1);
    }

    const tail = args.includes('--tail') || args.includes('-t');
    const linesArg = args.find(arg => arg.startsWith('--lines=') || arg.startsWith('-n='));
    const lines = linesArg ? parseInt(linesArg.split('=')[1]) : 50;
    const errorOnly = args.includes('--error') || args.includes('-e');
    const accessOnly = args.includes('--access') || args.includes('-a');

    let logType = 'proxy';
    if (errorOnly) logType = 'error';
    if (accessOnly) logType = 'access';

    const files = fs.readdirSync(LOG_DIR)
      .filter(file => file.startsWith(logType))
      .sort()
      .reverse();

    if (files.length === 0) {
      logger.logError('No log files found');
      process.exit(1);
    }

    const logFile = path.join(LOG_DIR, files[0]);

    if (tail) {
      console.log(`Following log file: ${logFile}`);
      console.log('Press Ctrl+C to exit');
      console.log('');

      const tailProcess = require('child_process').spawn('tail', ['-f', logFile], {
        stdio: 'inherit'
      });

      process.on('SIGINT', () => {
        tailProcess.kill();
        process.exit(0);
      });

    } else {
      const content = fs.readFileSync(logFile, 'utf-8');
      const logLines = content.split('\n').filter(line => line.trim());
      const displayLines = logLines.slice(-lines);

      console.log(`Showing last ${displayLines.length} lines of logs:`);
      console.log(`Log file: ${logFile}`);
      console.log('');
      console.log(displayLines.join('\n'));
    }

  } catch (err) {
    logger.logError(`Failed to view logs: ${err.message}`);
    process.exit(1);
  }
}
