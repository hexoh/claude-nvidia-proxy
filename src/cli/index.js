#!/usr/bin/env node
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { configCommand } from './commands/config.js';
import { statusCommand } from './commands/status.js';
import { logsCommand } from './commands/logs.js';
import { getLogger } from '../logger/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const logger = getLogger();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (command === '--help' || command === '-h') {
    console.log('Claude NVIDIA Proxy - CLI Tool');
    console.log('');
    console.log('Usage: cnp <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  start    Start the service');
    console.log('  stop     Stop the service');
    console.log('  restart  Restart the service');
    console.log('  config   Interactive configuration');
    console.log('  status   View service status');
    console.log('  logs     View logs');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h       Show help information');
    console.log('  --version, -v    Show version number');
    console.log('');
    console.log('Log command options:');
    console.log('  --tail, -t        Follow logs in real-time');
    console.log('  --lines=N, -n=N    Show specified number of lines (default: 50)');
    console.log('  --error, -e       Show only error logs');
    console.log('  --access, -a      Show only access logs');
    console.log('');
    console.log('Examples:');
    console.log('  cnp start');
    console.log('  cnp logs --tail');
    console.log('  cnp logs --lines=100 --error');
    process.exit(0);
  }

  if (command === '--version' || command === '-v') {
    console.log(packageJson.version);
    process.exit(0);
  }

  switch (command) {
    case 'start':
      await startCommand();
      break;
    case 'stop':
      await stopCommand();
      break;
    case 'restart':
      await restartCommand();
      break;
    case 'config':
      await configCommand();
      break;
    case 'status':
      await statusCommand();
      break;
    case 'logs':
      await logsCommand(args);
      break;
    default:
      console.log('Claude NVIDIA Proxy - CLI Tool');
      console.log('');
      console.log('Usage: cnp <command> [options]');
      console.log('');
      console.log('Commands:');
      console.log('  start    Start the service');
      console.log('  stop     Stop the service');
      console.log('  restart  Restart the service');
      console.log('  config   Interactive configuration');
      console.log('  status   View service status');
      console.log('  logs     View logs');
      console.log('');
      console.log('Options:');
      console.log('  --help, -h       Show help information');
      console.log('  --version, -v    Show version number');
      console.log('');
      console.log('Log command options:');
      console.log('  --tail, -t        Follow logs in real-time');
      console.log('  --lines=N, -n=N    Show specified number of lines (default: 50)');
      console.log('  --error, -e       Show only error logs');
      console.log('  --access, -a      Show only access logs');
      console.log('');
      console.log('Examples:');
      console.log('  cnp start');
      console.log('  cnp logs --tail');
      console.log('  cnp logs --lines=100 --error');
      process.exit(0);
  }
}

main().catch(err => {
  logger.logError(`Error: ${err.message}`);
  process.exit(1);
});
