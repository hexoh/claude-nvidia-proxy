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
    console.log('=== Claude NVIDIA Proxy Status ===');
    console.log('');

    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
      try {
        process.kill(pid, 0);
        console.log('Service Status: Running');
        console.log(`Process ID: ${pid}`);

        try {
          const stats = fs.statSync(PID_FILE);
          const startTime = new Date(stats.mtimeMs);
          const uptime = Math.floor((Date.now() - stats.mtimeMs) / 1000);
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = uptime % 60;
          console.log(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
        } catch (e) {
        }
      } catch (e) {
        console.log('Service Status: Not running');
        console.log('Note: PID file exists but process is not running');
      }
    } else {
      console.log('Service Status: Not running');
    }

    console.log('');

    if (fs.existsSync(getConfigPath())) {
      const config = readConfigFile();
      console.log('Configuration:');
      console.log(`  Config File: ${getConfigPath()}`);
      console.log(`  PROXY_URL: ${config.PROXY_URL}`);
      console.log(`  API_BASE_URL: ${config.API_BASE_URL}`);
      console.log(`  Auth Status: ${config.NV_API_KEY ? 'Enabled' : 'Disabled'}`);
      console.log(`  TIMEOUT: ${config.TIMEOUT}ms`);
    } else {
      console.log('Configuration Status: Not configured');
      console.log('Please run: cnp config');
    }

    console.log('');
    console.log('Log Directory: ~/.claude-nvidia-proxy/logs');

  } catch (err) {
    logger.logError(`Failed to get status: ${err.message}`);
    process.exit(1);
  }
}
