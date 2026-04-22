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

  console.log(`listening on ${cfg.addr}`);
  console.log(`upstream: ${cfg.upstreamURL}`);
  if (cfg.serverAPIKey) {
    console.log('inbound auth: enabled');
  } else {
    console.log('inbound auth: disabled (SERVER_API_KEY not set)');
  }

  const [host, port] = cfg.addr.split(':');
  server.listen(parseInt(port), host);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, loadConfig, getConfig };