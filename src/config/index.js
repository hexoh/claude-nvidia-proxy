import dotenv from 'dotenv';

dotenv.config();

let config = {
  addr: process.env.ADDR || ':3001',
  upstreamURL: '',
  providerAPIKey: '',
  serverAPIKey: process.env.SERVER_API_KEY || '',
  timeout: 5 * 60 * 1000,
  logBodyMax: 4096,
  logStreamPreviewMax: 256
};

function loadConfig() {
  const timeoutStr = (process.env.UPSTREAM_TIMEOUT_SECONDS || '300').trim();
  const seconds = parseInt(timeoutStr, 10);
  if (isNaN(seconds) || seconds <= 0) {
    throw new Error(`invalid UPSTREAM_TIMEOUT_SECONDS: "${timeoutStr}"`);
  }
  config.timeout = seconds * 1000;

  const logBodyMaxStr = (process.env.LOG_BODY_MAX_CHARS || '4096').trim();
  const logBodyMax = parseInt(logBodyMaxStr, 10);
  if (isNaN(logBodyMax) || logBodyMax < 0) {
    throw new Error(`invalid LOG_BODY_MAX_CHARS: "${logBodyMaxStr}"`);
  }
  config.logBodyMax = logBodyMax;

  const logStreamPreviewMaxStr = (process.env.LOG_STREAM_TEXT_PREVIEW_CHARS || '256').trim();
  const logStreamPreviewMax = parseInt(logStreamPreviewMaxStr, 10);
  if (isNaN(logStreamPreviewMax) || logStreamPreviewMax < 0) {
    throw new Error(`invalid LOG_STREAM_TEXT_PREVIEW_CHARS: "${logStreamPreviewMaxStr}"`);
  }
  config.logStreamPreviewMax = logStreamPreviewMax;

  config.upstreamURL = (process.env.UPSTREAM_URL || '').trim();
  config.providerAPIKey = (process.env.PROVIDER_API_KEY || '').trim();
  config.serverAPIKey = (process.env.SERVER_API_KEY || '').trim();
  config.addr = (process.env.ADDR || ':8888').trim();

  if (!config.upstreamURL) {
    throw new Error('missing UPSTREAM_URL in .env file');
  }
  if (!config.providerAPIKey) {
    throw new Error('missing PROVIDER_API_KEY in .env file');
  }

  return config;
}

function getConfig() {
  return config;
}

export { loadConfig, getConfig };