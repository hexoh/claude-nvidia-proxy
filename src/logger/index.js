import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';

const LOG_DIR = path.join(os.homedir(), '.claude-nvidia-proxy', 'logs');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const LOG_RETENTION_DAYS = 7;

let loggerInstance = null;

function createLogger() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  cleanOldLogs();

  return {
    logInfo,
    logError,
    logAccess,
    rotateLogs,
    cleanOldLogs,
    checkPortAvailable
  };
}

function getLogFilePath(type, date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];
  const baseName = `${type}-${dateStr}.log`;
  return path.join(LOG_DIR, baseName);
}

function findNextLogFileIndex(type, date) {
  let index = 1;
  while (true) {
    const filePath = path.join(LOG_DIR, `${type}-${date}-${index}.log`);
    if (!fs.existsSync(filePath)) {
      return index;
    }
    const stats = fs.statSync(filePath);
    if (stats.size < MAX_FILE_SIZE) {
      return index;
    }
    index++;
  }
}

function rotateIfNeeded(filePath) {
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  const stats = fs.statSync(filePath);
  if (stats.size >= MAX_FILE_SIZE) {
    const parts = path.basename(filePath, '.log').split('-');
    const type = parts[0];
    const date = parts.slice(1, -1).join('-');
    const index = findNextLogFileIndex(type, date);
    const newPath = path.join(LOG_DIR, `${type}-${date}-${index}.log`);
    return newPath;
  }

  return filePath;
}

function writeLog(type, message) {
  const date = new Date();
  const baseFilePath = getLogFilePath(type, date);
  const filePath = rotateIfNeeded(baseFilePath);

  const timestamp = date.toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(filePath, logLine, 'utf-8');
}

function logInfo(message) {
  const logLine = `[INFO] ${message}`;
  console.log(logLine);
  writeLog('proxy', logLine);
}

function logError(message) {
  const logLine = `[ERROR] ${message}`;
  console.error(logLine);
  writeLog('error', logLine);
}

function logAccess(message) {
  const logLine = `[ACCESS] ${message}`;
  writeLog('access', logLine);
}

function rotateLogs() {
  if (!fs.existsSync(LOG_DIR)) {
    return;
  }

  const files = fs.readdirSync(LOG_DIR);
  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    const stats = fs.statSync(filePath);

    if (stats.size >= MAX_FILE_SIZE && !file.includes('-')) {
      const parts = file.replace('.log', '').split('-');
      const type = parts[0];
      const date = parts.slice(1).join('-');
      const index = findNextLogFileIndex(type, date);
      const newPath = path.join(LOG_DIR, `${type}-${date}-${index}.log`);
      fs.renameSync(filePath, newPath);
    }
  });
}

function cleanOldLogs() {
  if (!fs.existsSync(LOG_DIR)) {
    return;
  }

  const files = fs.readdirSync(LOG_DIR);
  const now = Date.now();
  const maxAge = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(LOG_DIR, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filePath);
    }
  });
}

function checkPortAvailable(port, host = 'localhost') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });

    server.listen(port, host);
  });
}

function getLogger() {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

export {
  createLogger,
  getLogger,
  logInfo,
  logError,
  logAccess,
  rotateLogs,
  cleanOldLogs,
  checkPortAvailable
};
