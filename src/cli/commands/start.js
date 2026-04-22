import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig, getConfigPath } from '../../config/index.js';
import { createServer } from '../../server/index.js';
import { getLogger, checkPortAvailable } from '../../logger/index.js';

const PID_DIR = path.join(os.homedir(), '.claude-nvidia-proxy');
const PID_FILE = path.join(PID_DIR, 'proxy.pid');

export async function startCommand() {
  const logger = getLogger();

  try {
    if (!fs.existsSync(getConfigPath())) {
      logger.logError('配置文件不存在，请先运行: cnp config');
      process.exit(1);
    }

    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'));
      try {
        process.kill(pid, 0);
        logger.logError(`服务已在运行 (PID: ${pid})`);
        process.exit(1);
      } catch (e) {
        fs.unlinkSync(PID_FILE);
      }
    }

    const cfg = loadConfig();
    const [host, port] = cfg.addr.split(':');

    const portAvailable = await checkPortAvailable(parseInt(port), host);
    if (!portAvailable) {
      logger.logError(`端口 ${port} 已被占用`);
      process.exit(1);
    }

    const server = createServer(cfg);

    if (!fs.existsSync(PID_DIR)) {
      fs.mkdirSync(PID_DIR, { recursive: true });
    }
    fs.writeFileSync(PID_FILE, process.pid.toString());

    logger.logInfo(`listening on ${cfg.addr}`);
    logger.logInfo(`upstream: ${cfg.upstreamURL}`);
    if (cfg.serverAPIKey) {
      logger.logInfo('inbound auth: enabled');
    } else {
      logger.logInfo('inbound auth: disabled (SERVER_API_KEY not set)');
    }

    server.listen(parseInt(port), host);

    process.on('SIGTERM', () => {
      logger.logInfo('Received SIGTERM, shutting down...');
      server.close(() => {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.logInfo('Received SIGINT, shutting down...');
      server.close(() => {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
        process.exit(0);
      });
    });

  } catch (err) {
    logger.logError(`启动失败: ${err.message}`);
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    process.exit(1);
  }
}
