#!/usr/bin/env node
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { restartCommand } from './commands/restart.js';
import { configCommand } from './commands/config.js';
import { statusCommand } from './commands/status.js';
import { logsCommand } from './commands/logs.js';
import { getLogger } from '../logger/index.js';

const logger = getLogger();

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

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
      console.log('Claude NVIDIA Proxy - CLI 工具');
      console.log('');
      console.log('用法: cnp <command> [options]');
      console.log('');
      console.log('命令:');
      console.log('  start    启动服务');
      console.log('  stop     停止服务');
      console.log('  restart  重启服务');
      console.log('  config   交互式配置');
      console.log('  status   查看服务状态');
      console.log('  logs     查看日志');
      console.log('');
      console.log('日志命令选项:');
      console.log('  --tail, -t        实时跟踪日志');
      console.log('  --lines=N, -n=N    显示指定行数 (默认: 50)');
      console.log('  --error, -e       只显示错误日志');
      console.log('  --access, -a      只显示访问日志');
      console.log('');
      console.log('示例:');
      console.log('  cnp start');
      console.log('  cnp logs --tail');
      console.log('  cnp logs --lines=100 --error');
      process.exit(0);
  }
}

main().catch(err => {
  logger.logError(`错误: ${err.message}`);
  process.exit(1);
});
