#!/usr/bin/env node
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { configCommand } from './commands/config.js';
import { statusCommand } from './commands/status.js';
import { logsCommand } from './commands/logs.js';
import { 
  modelListCommand, 
  modelAddCommand, 
  modelRmCommand, 
  modelSetupCommand, 
  modelHelpCommand 
} from './commands/model.js';
import { testCommand, testHelpCommand } from './commands/test.js';
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

  if (command === '--serve') {
    const { serveCommand } = await import('./commands/serve.js');
    await serveCommand();
    return;
  }

  if (command === '--help' || command === '-h') {
    console.log('Claude NVIDIA Proxy - CLI Tool');
    console.log('');
    console.log('Usage: cnp <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  start         Start the service');
    console.log('  stop          Stop the service');
    console.log('  restart       Restart the service');
    console.log('  config        Interactive configuration');
    console.log('  status        View service status');
    console.log('  logs          View logs');
    console.log('  model         Model management');
    console.log('  test         Test a model');
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
    console.log('Model command options:');
    console.log('  list             List available models');
    console.log('  add <model>      Add a new model');
    console.log('  rm <model>       Remove a model');
    console.log('  setup            Setup Claude Code model configuration');
    console.log('');
    console.log('Test command options:');
    console.log('  test [model]     Test a model with a prompt');
    console.log('');
    console.log('Examples:');
    console.log('  cnp start');
    console.log('  cnp logs --tail');
    console.log('  cnp logs --lines=100 --error');
    console.log('  cnp model list');
    console.log('  cnp model add z-ai/glm4.7');
    console.log('  cnp model setup');
    console.log('  cnp test');
    console.log('  cnp test z-ai/glm4.7');
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
    case 'model':
      const subCommand = args[0];
      const subArgs = args.slice(1);
      
      if (!subCommand || subCommand === '--help' || subCommand === '-h') {
        await modelHelpCommand();
        process.exit(0);
      }
      
      switch (subCommand) {
        case 'list':
          await modelListCommand();
          break;
        case 'add':
          await modelAddCommand(subArgs[0]);
          break;
        case 'rm':
          await modelRmCommand(subArgs[0]);
          break;
        case 'setup':
          await modelSetupCommand();
          break;
        default:
          console.log(`Unknown model command: ${subCommand}`);
          console.log('Run "cnp model --help" for available commands');
          process.exit(1);
      }
      break;
    case 'test':
      if (args[0] === '--help' || args[0] === '-h') {
        await testHelpCommand();
        process.exit(0);
      }
      await testCommand(args[0]);
      break;
    default:
      console.log('Claude NVIDIA Proxy - CLI Tool');
      console.log('');
      console.log('Usage: cnp <command> [options]');
      console.log('');
      console.log('Commands:');
      console.log('  start         Start the service');
      console.log('  stop          Stop the service');
      console.log('  restart       Restart the service');
      console.log('  config        Interactive configuration');
      console.log('  status        View service status');
      console.log('  logs          View logs');
      console.log('  model         Model management');
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
console.log('Model command options:');
    console.log('  list             List available models');
    console.log('  add <model>      Add a new model');
    console.log('  rm <model>       Remove a model');
    console.log('  setup            Setup Claude Code model configuration');
    console.log('');
    console.log('Test command options:');
    console.log('  test [model]     Test a model with a prompt');
    console.log('');
    console.log('Examples:');
    console.log('  cnp start');
    console.log('  cnp logs --tail');
    console.log('  cnp logs --lines=100 --error');
    console.log('  cnp model list');
    console.log('  cnp model add z-ai/glm4.7');
    console.log('  cnp model setup');
    console.log('  cnp test');
    console.log('  cnp test z-ai/glm4.7');
    process.exit(0);
  }
}

main().catch(err => {
  logger.logError(`Error: ${err.message}`);
  process.exit(1);
});
