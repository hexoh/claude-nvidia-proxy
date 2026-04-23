import { loadConfig, getConfig } from './config/index.js';
import { createServer } from './server/index.js';

function main() {
  try {
    const cfg = loadConfig();
  } catch (err) {
    console.error(`config error: ${err.message}`);
    process.exit(1);
  }

  const cfg = getConfig();
  const server = createServer(cfg);

  console.log(`listening on ${cfg.PROXY_URL}`);
  console.log(`upstream: ${cfg.API_BASE_URL}`);

  const [host, port] = cfg.PROXY_URL.split(':');
  server.listen(parseInt(port), host);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, loadConfig, getConfig };