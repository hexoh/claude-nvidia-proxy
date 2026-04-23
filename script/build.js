import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create dist directory
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build test file with esbuild (bundle openai)
const srcDir = path.join(rootDir, 'src');

// Files that need bundling (with external dependencies)
const filesToBundle = [
  { entry: path.join(srcDir, 'test', 'test-nvidia.js'), out: path.join(distDir, 'test', 'test-nvidia.js') },
];

for (const file of filesToBundle) {
  const outDir = path.dirname(file.out);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  await esbuild.build({
    entryPoints: [file.entry],
    bundle: true,
    outfile: file.out,
    platform: 'node',
    format: 'esm',
    external: [],
    logLevel: 'info',
  });
  console.log(`Bundled: ${path.relative(rootDir, file.out)}`);
}

// Copy other files from src to dist (skip test - it's bundled)
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'test') {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(srcDir, distDir);

// Make CLI executable
const cliPath = path.join(distDir, 'cli', 'index.js');
fs.chmodSync(cliPath, '755');

// Create TypeScript declaration file
const dtsContent = `export function main(): void;
export function loadConfig(): any;
export function getConfig(): any;
export function createServer(cfg: any): any;
export function handleMessages(req: any, res: any, cfg: any): Promise<void>;
export function convertAnthropicToOpenAI(anthropicReq: any): any;
export function convertOpenAIToAnthropic(openaiResp: any): any;
export function mapFinishReason(finish: string): string;
export function doUpstreamJSON(ctx: any, cfg: any, openaiReq: any): Promise<any>;
export function proxyStream(res: any, req: any, cfg: any, reqID: string, openaiReq: any): Promise<void>;
export function checkInboundAuth(req: any, expected: string): boolean;
export function writeJSONError(res: any, status: number, code: string): void;
export function logForwardedRequest(reqID: string, cfg: any, anthropicReq: any, openaiReq: any): void;
export function logForwardedUpstreamBody(reqID: string, cfg: any, body: any): void;
`;
const dtsPath = path.join(distDir, 'index.d.ts');
fs.writeFileSync(dtsPath, dtsContent);

console.log('Build completed successfully!');
console.log('Files created:');
console.log('  - dist/index.js');
console.log('  - dist/cli/index.js');
console.log('  - dist/config/index.js');
console.log('  - dist/converter/index.js');
console.log('  - dist/utils/index.js');
console.log('  - dist/proxy/index.js');
console.log('  - dist/server/index.js');
console.log('  - dist/index.d.ts');