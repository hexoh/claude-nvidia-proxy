import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../../logger/index.js';
import { readConfigFile, getConfigPath } from '../../config/index.js';

const PID_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const PID_FILE = path.join(PID_DIR, 'proxy.pid');

export async function statusCommand() {
  const logger = getLogger();

  try {
    console.log('=== Claude NVIDIA Proxy 状态 ===');
    console.log('');

    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
      try {
        process.kill(pid, 0);
        console.log('服务状态: 运行中');
        console.log(`进程 ID: ${pid}`);

        try {
          const stats = fs.statSync(PID_FILE);
          const startTime = new Date(stats.mtimeMs);
          const uptime = Math.floor((Date.now() - stats.mtimeMs) / 1000);
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = uptime % 60;
          console.log(`运行时间: ${hours}小时 ${minutes}分钟 ${seconds}秒`);
        } catch (e) {
        }
      } catch (e) {
        console.log('服务状态: 未运行');
        console.log('注意: PID 文件存在但进程未运行');
      }
    } else {
      console.log('服务状态: 未运行');
    }

    console.log('');

    if (fs.existsSync(getConfigPath())) {
      const config = readConfigFile();
      console.log('配置信息:');
      console.log(`  配置文件: ${getConfigPath()}`);
      console.log(`  监听地址: ${config.addr}`);
      console.log(`  上游地址: ${config.upstreamURL}`);
      console.log(`  认证状态: ${config.serverAPIKey ? '已启用' : '未启用'}`);
      console.log(`  超时时间: ${config.timeout}ms`);
    } else {
      console.log('配置状态: 未配置');
      console.log('请运行: cnp config');
    }

    console.log('');
    console.log('日志目录: ~/.claude-nvidia-proxy/logs');

  } catch (err) {
    logger.logError(`获取状态失败: ${err.message}`);
    process.exit(1);
  }
}
