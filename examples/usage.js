/**
 * 示例：如何在代码中使用 claude-nvidia-proxy
 */

import { createProxy } from 'claude-nvidia-proxy';

// 基本使用
async function basicExample() {
  const proxy = createProxy({
    upstreamURL: 'https://integrate.api.nvidia.com/v1/chat/completions',
    providerAPIKey: 'your-nvidia-api-key',
    serverAPIKey: 'your-secret-key',
    port: 3000
  });

  await proxy.start();
  console.log('Proxy server running on port 3000');

  // 优雅关闭
  process.on('SIGTERM', async () => {
    await proxy.stop();
    process.exit(0);
  });
}

// 自定义配置
async function customConfigExample() {
  const proxy = createProxy({
    upstreamURL: 'https://integrate.api.nvidia.com/v1/chat/completions',
    providerAPIKey: 'your-nvidia-api-key',
    serverAPIKey: 'your-secret-key',
    port: 8080,
    host: '0.0.0.0',
    timeout: 600000, // 10 分钟
    logBodyMax: 8192,
    logStreamPreviewMax: 512
  });

  await proxy.start();
  console.log('Custom proxy server running on 0.0.0.0:8080');
}

// 集成到 Express 应用
import express from 'express';

async function expressIntegrationExample() {
  const app = express();
  const proxy = createProxy({
    upstreamURL: 'https://integrate.api.nvidia.com/v1/chat/completions',
    providerAPIKey: 'your-nvidia-api-key',
    serverAPIKey: 'your-secret-key',
    port: 3000
  });

  // 获取代理服务器实例
  const server = await proxy.getServer();

  // 添加自定义中间件
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // 添加自定义路由
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // 启动代理
  await proxy.start();
  console.log('Express app with proxy running on port 3000');
}

// 使用环境变量
async function envConfigExample() {
  const proxy = createProxy({
    // 从环境变量读取配置
    upstreamURL: process.env.UPSTREAM_URL,
    providerAPIKey: process.env.PROVIDER_API_KEY,
    serverAPIKey: process.env.SERVER_API_KEY,
    port: parseInt(process.env.PORT || '3000'),
    timeout: parseInt(process.env.TIMEOUT || '300000')
  });

  await proxy.start();
  console.log(`Proxy server running on port ${process.env.PORT || 3000}`);
}

// 错误处理
async function errorHandlingExample() {
  const proxy = createProxy({
    upstreamURL: 'https://integrate.api.nvidia.com/v1/chat/completions',
    providerAPIKey: 'your-nvidia-api-key',
    serverAPIKey: 'your-secret-key',
    port: 3000
  });

  try {
    await proxy.start();
    console.log('Proxy server started successfully');
  } catch (error) {
    console.error('Failed to start proxy:', error);
    process.exit(1);
  }

  // 监听服务器错误
  proxy.on('error', (error) => {
    console.error('Proxy server error:', error);
  });
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample().catch(console.error);
}

export {
  basicExample,
  customConfigExample,
  expressIntegrationExample,
  envConfigExample,
  errorHandlingExample
};