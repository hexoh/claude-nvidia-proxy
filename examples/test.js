/**
 * 测试示例：如何测试 claude-nvidia-proxy
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createProxy } from 'claude-nvidia-proxy';

describe('Claude-NVIDIA-Proxy', () => {
  let proxy;
  const testPort = 3001;

  beforeAll(async () => {
    // 启动测试代理
    proxy = createProxy({
      upstreamURL: 'https://integrate.api.nvidia.com/v1/chat/completions',
      providerAPIKey: process.env.TEST_API_KEY || 'test-key',
      serverAPIKey: 'test-secret',
      port: testPort
    });

    await proxy.start();
  });

  afterAll(async () => {
    // 停止测试代理
    await proxy.stop();
  });

  it('should start successfully', () => {
    expect(proxy).toBeDefined();
    expect(proxy.isRunning()).toBe(true);
  });

  it('should handle health check', async () => {
    const response = await fetch(`http://localhost:${testPort}/`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('claude-nvidia-proxy');
    expect(data.health).toBe('ok');
  });

  it('should handle message request', async () => {
    const response = await fetch(`http://localhost:${testPort}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-secret'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-405b-instruct',
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'Hello!' }
        ]
      })
    });

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('content');
  });

  it('should reject unauthorized requests', async () => {
    const response = await fetch(`http://localhost:${testPort}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'wrong-key'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-405b-instruct',
        max_tokens: 100,
        messages: [
          { role: 'user', content: 'Hello!' }
        ]
      })
    });

    expect(response.status).toBe(401);
  });

  it('should handle streaming requests', async () => {
    const response = await fetch(`http://localhost:${testPort}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-secret'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-405b-instruct',
        max_tokens: 100,
        stream: true,
        messages: [
          { role: 'user', 'content': 'Hello!' }
        ]
      })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      if (chunk.includes('message_start')) {
        chunks++;
      }
    }

    expect(chunks).toBeGreaterThan(0);
  });
});

// 集成测试示例
describe('Integration Tests', () => {
  it('should handle tool calls', async () => {
    // 测试工具调用功能
  });

  it('should handle image inputs', async () => {
    // 测试图片输入功能
  });

  it('should handle long conversations', async () => {
    // 测试长对话功能
  });
});