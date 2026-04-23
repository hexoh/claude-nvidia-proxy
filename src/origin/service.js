import http from 'http';
import https from 'https';
import fs from 'fs';
import { URL } from 'url';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Configuration
let config = {
  addr: process.env.ADDR || ':3001',
  upstreamURL: '',
  providerAPIKey: '',
  serverAPIKey: process.env.SERVER_API_KEY || '',
  timeout: 5 * 60 * 1000, // 5 minutes in milliseconds
  logBodyMax: 4096,
  logStreamPreviewMax: 256
};

// Load configuration from .env file
function loadConfig() {
  // Parse timeout
  const timeoutStr = (process.env.UPSTREAM_TIMEOUT_SECONDS || '300').trim();
  const seconds = parseInt(timeoutStr, 10);
  if (isNaN(seconds) || seconds <= 0) {
    throw new Error(`invalid UPSTREAM_TIMEOUT_SECONDS: "${timeoutStr}"`);
  }
  config.timeout = seconds * 1000;

  // Parse log body max
  const logBodyMaxStr = (process.env.LOG_BODY_MAX_CHARS || '4096').trim();
  const logBodyMax = parseInt(logBodyMaxStr, 10);
  if (isNaN(logBodyMax) || logBodyMax < 0) {
    throw new Error(`invalid LOG_BODY_MAX_CHARS: "${logBodyMaxStr}"`);
  }
  config.logBodyMax = logBodyMax;

  // Parse log stream preview max
  const logStreamPreviewMaxStr = (process.env.LOG_STREAM_TEXT_PREVIEW_CHARS || '256').trim();
  const logStreamPreviewMax = parseInt(logStreamPreviewMaxStr, 10);
  if (isNaN(logStreamPreviewMax) || logStreamPreviewMax < 0) {
    throw new Error(`invalid LOG_STREAM_TEXT_PREVIEW_CHARS: "${logStreamPreviewMaxStr}"`);
  }
  config.logStreamPreviewMax = logStreamPreviewMax;

  // Set required values from environment
  config.upstreamURL = (process.env.UPSTREAM_URL || '').trim();
  config.providerAPIKey = (process.env.PROVIDER_API_KEY || '').trim();
  config.serverAPIKey = (process.env.SERVER_API_KEY || '').trim();
  config.addr = (process.env.ADDR || ':8888').trim();

  // Validate required configuration
  if (!config.upstreamURL) {
    throw new Error('missing UPSTREAM_URL in .env file');
  }
  if (!config.providerAPIKey) {
    throw new Error('missing PROVIDER_API_KEY in .env file');
  }

  return config;
}

// Check inbound authentication
function checkInboundAuth(req, expected) {
  const auth = (req.headers.authorization || '').trim();
  if (auth.toLowerCase().startsWith('bearer ')) {
    const got = auth.substring(7).trim();
    return got === expected;
  }
  const got = (req.headers['x-api-key'] || '').trim();
  if (got) {
    return got === expected;
  }
  return false;
}

// Write JSON error response
function writeJSONError(res, status, code) {
  const errPayload = {
    type: 'error',
    error: {
      type: 'api_error',
      code: code,
      message: code
    }
  };
  // Critical fix: Check if HTTP response headers have already been sent to the client
  if (res.headersSent) {
    // If error occurs during streaming, cannot set Header, only append SSE stream error event and force disconnect
    try {
      res.write(`event: error\ndata: ${JSON.stringify(errPayload)}\n\n`);
      res.end();
    } catch (e) {
      // Ignore underlying network disconnection exceptions
    }
    return;
  }

  // If error occurs just after request comes in (before streaming starts), return JSON with HTTP status code normally
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(errPayload));
}

// Convert Anthropic request to OpenAI format
function convertAnthropicToOpenAI(anthropicReq) {
  const messages = [];

  // Handle system message
  const systemText = extractSystemText(anthropicReq.system);
  if (systemText.trim()) {
    messages.push({
      role: 'system',
      content: systemText
    });
  }

  // Convert messages
  for (const m of anthropicReq.messages || []) {
    const role = (m.role || '').trim();
    if (!role) continue;

    const content = m.content;

    // Check if content is a string
    if (typeof content === 'string') {
      messages.push({
        role: role,
        content: content
      });
      continue;
    }

    // Handle array of content blocks
    if (Array.isArray(content)) {
      switch (role) {
        case 'user':
          const userMsgs = convertAnthropicUserBlocksToOpenAIMessages(content);
          messages.push(...userMsgs);
          break;
        case 'assistant':
          const assistantMsg = convertAnthropicAssistantBlocksToOpenAIMessage(content);
          messages.push(assistantMsg);
          break;
        default:
          const text = joinTextBlocks(content);
          messages.push({
            role: role,
            content: text
          });
      }
    }
  }

  const openaiReq = {
    model: anthropicReq.model,
    messages: messages,
    max_tokens: anthropicReq.max_tokens || 1024,
    temperature: anthropicReq.temperature,
    stream: anthropicReq.stream || false
  };

  // Convert tools
  if (anthropicReq.tools && anthropicReq.tools.length > 0) {
    openaiReq.tools = anthropicReq.tools.map(t => {
      let params = {};
      if (t.input_schema) {
        try {
          params = typeof t.input_schema === 'string'
            ? JSON.parse(t.input_schema)
            : t.input_schema;
        } catch (e) {
          params = {};
        }
      }
      return {
        type: 'function',
        function: {
          name: t.name,
          description: t.description || '',
          parameters: params
        }
      };
    });
  }

  // Convert tool_choice
  if (anthropicReq.tool_choice) {
    openaiReq.tool_choice = convertToolChoice(anthropicReq.tool_choice);
  }

  return openaiReq;
}

// Extract system text from system field
function extractSystemText(system) {
  if (!system) return '';

  if (typeof system === 'string') {
    return system;
  }

  if (Array.isArray(system)) {
    return joinTextBlocks(system);
  }

  return '';
}

// Join text blocks
function joinTextBlocks(blocks) {
  const parts = [];
  for (const blk of blocks || []) {
    if (blk.type === 'text' && blk.text) {
      parts.push(blk.text);
    }
  }
  return parts.join('\n');
}

// Convert Anthropic user blocks to OpenAI messages
function convertAnthropicUserBlocksToOpenAIMessages(blocks) {
  const out = [];

  // Handle tool_result blocks
  for (const blk of blocks) {
    if (blk.type !== 'tool_result' || !blk.tool_use_id?.trim()) continue;

    let contentStr = '';
    if (blk.content) {
      if (typeof blk.content === 'string') {
        contentStr = blk.content;
      } else {
        contentStr = JSON.stringify(blk.content);
      }
    }

    out.push({
      role: 'tool',
      tool_call_id: blk.tool_use_id,
      content: contentStr
    });
  }

  // Handle text and image blocks
  const parts = [];
  for (const blk of blocks) {
    switch (blk.type) {
      case 'text':
        if (blk.text) {
          parts.push({ type: 'text', text: blk.text });
        }
        break;
      case 'image':
        if (blk.source) {
          let url = '';
          switch (blk.source.type) {
            case 'base64':
              if (blk.source.media_type && blk.source.data) {
                try {
                  Buffer.from(blk.source.data, 'base64');
                  url = `data:${blk.source.media_type};base64,${blk.source.data}`;
                } catch (e) {
                  // Invalid base64, skip
                }
              }
              break;
            case 'url':
              url = blk.source.url || '';
              break;
          }
          if (url) {
            parts.push({
              type: 'image_url',
              image_url: { url: url }
            });
          }
        }
        break;
    }
  }

  if (parts.length === 0) {
    out.push({ role: 'user', content: '' });
  } else if (parts.length === 1 && parts[0].type === 'text') {
    out.push({ role: 'user', content: parts[0].text });
  } else {
    out.push({ role: 'user', content: parts });
  }

  return out;
}

// Convert Anthropic assistant blocks to OpenAI message
function convertAnthropicAssistantBlocksToOpenAIMessage(blocks) {
  const text = joinTextBlocks(blocks);

  const toolCalls = [];
  for (const blk of blocks) {
    if (blk.type !== 'tool_use' || !blk.id?.trim() || !blk.name?.trim()) continue;

    let args = '{}';
    if (blk.input) {
      args = typeof blk.input === 'string' ? blk.input : JSON.stringify(blk.input);
    }

    toolCalls.push({
      id: blk.id,
      type: 'function',
      function: {
        name: blk.name,
        arguments: args
      }
    });
  }

  const msg = {
    role: 'assistant'
  };

  if (text) {
    msg.content = text;
  } else {
    msg.content = null;
  }

  if (toolCalls.length > 0) {
    msg.tool_calls = toolCalls;
  }

  return msg;
}

// Convert tool choice
function convertToolChoice(v) {
  if (typeof v === 'string') return v;
  if (typeof v !== 'object' || v === null) return v;

  const typ = v.type;
  switch (typ) {
    case 'auto':
    case 'none':
    case 'required':
      return typ;
    case 'tool':
      const name = v.name;
      if (!name) return 'auto';
      return {
        type: 'function',
        function: { name: name }
      };
    default:
      return v;
  }
}

// Convert OpenAI response to Anthropic format
function convertOpenAIToAnthropic(openaiResp) {
  const content = [];
  let finishReason = '';

  if (openaiResp.choices && openaiResp.choices.length > 0) {
    const ch = openaiResp.choices[0];
    finishReason = ch.finish_reason || '';

    if (ch.message && ch.message.content) {
      content.push({
        type: 'text',
        text: ch.message.content
      });
    }

    if (ch.message && ch.message.tool_calls) {
      for (const tc of ch.message.tool_calls) {
        let input = {};
        if (tc.function && tc.function.arguments) {
          try {
            input = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments;
          } catch (e) {
            input = { text: String(tc.function.arguments) };
          }
        }
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function?.name || '',
          input: input
        });
      }
    }
  }

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheRead = 0;

  if (openaiResp.usage) {
    cacheRead = openaiResp.usage.prompt_tokens_details?.cached_tokens || 0;
    inputTokens = (openaiResp.usage.prompt_tokens || 0) - cacheRead;
    outputTokens = openaiResp.usage.completion_tokens || 0;
  }

  return {
    id: openaiResp.id,
    type: 'message',
    role: 'assistant',
    model: openaiResp.model,
    content: content,
    stop_reason: mapFinishReason(finishReason),
    stop_sequence: null,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cache_read_input_tokens: cacheRead
    }
  };
}

// Map finish reason
function mapFinishReason(finish) {
  switch (finish) {
    case 'stop':
      return 'end_turn';
    case 'length':
      return 'max_tokens';
    case 'tool_calls':
      return 'tool_use';
    case 'content_filter':
      return 'stop_sequence';
    default:
      return finish ? 'end_turn' : 'end_turn';
  }
}

// Make upstream request
function doUpstreamJSON(ctx, cfg, openaiReq) {
  return new Promise((resolve, reject) => {
    const bodyBytes = JSON.stringify(openaiReq);
    const url = new URL(cfg.upstreamURL);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.providerAPIKey}`,
        'Content-Length': Buffer.byteLength(bodyBytes)
      },
      timeout: cfg.timeout
    };

    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({ body, res });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(bodyBytes);
    req.end();
  });
}

// Handle streaming response
async function proxyStream(res, req, cfg, reqID, openaiReq) {
  openaiReq.stream = true;

  const bodyBytes = JSON.stringify(openaiReq);
  const url = new URL(cfg.upstreamURL);

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.providerAPIKey}`,
      'Content-Length': Buffer.byteLength(bodyBytes)
    }
  };

  const protocol = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const upReq = protocol.request(options, (upRes) => {
      console.log(`[${reqID}] upstream status=${upRes.statusCode} (stream)`);

      if (upRes.statusCode < 200 || upRes.statusCode >= 300) {
        let raw = '';
        upRes.on('data', chunk => raw += chunk);
        upRes.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(upRes.statusCode);
          res.end(raw);
          logForwardedUpstreamBody(reqID, cfg, raw);
          res.end();
          reject(new Error(`upstream status ${upRes.statusCode}`));
        });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.writeHead(200);

      const encoder = (event, payload) => {
        const data = JSON.stringify(payload);
        res.write(`event: ${event}\ndata: ${data}\n\n`);
      };

      const messageID = `msg_${Date.now()}`;
      encoder('message_start', {
        type: 'message_start',
        message: {
          id: messageID,
          type: 'message',
          role: 'assistant',
          model: openaiReq.model,
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: {
            input_tokens: 0,
            output_tokens: 0
          }
        }
      });

      let chunkCount = 0;
      let textChars = 0;
      let toolDeltaChunks = 0;
      let toolArgsChars = 0;
      let finishReason = '';
      let preview = '';
      let sawDone = false;

      const toolStates = new Map();
      let nextContentBlockIndex = 0;
      let currentContentBlockIndex = -1;
      let currentBlockType = '';
      let hasTextBlock = false;

      const assignContentBlockIndex = () => {
        const idx = nextContentBlockIndex;
        nextContentBlockIndex++;
        return idx;
      };

      const closeCurrentBlock = () => {
        if (currentContentBlockIndex >= 0) {
          encoder('content_block_stop', {
            type: 'content_block_stop',
            index: currentContentBlockIndex
          });
          currentContentBlockIndex = -1;
          currentBlockType = '';
        }
      };

      let buffer = '';

      upRes.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;
          if (!trimmedLine.startsWith('data:')) continue;

          const data = trimmedLine.substring(5).trim();
          if (data === '[DONE]') {
            sawDone = true;
            break;
          }

          try {
            const chunkData = JSON.parse(data);
            if (!chunkData.choices || chunkData.choices.length === 0) continue;

            chunkCount++;
            const delta = chunkData.choices[0].delta;

            // [Fix 1: Text must be processed before tools to prevent subsequent interruption of tool flow]
            // Note: Added check here to only process text with actual content, skip empty strings
            if (delta.content !== undefined && delta.content !== null && delta.content !== "") {
              textChars += delta.content.length;
              if (cfg.logStreamPreviewMax > 0 && preview.length < cfg.logStreamPreviewMax) {
                preview += delta.content.substring(0, cfg.logStreamPreviewMax - preview.length);
              }

              // [Fix 2: If current block is not text, immediately start a new text block, completely abandon hasTextBlock]
              if (currentBlockType !== 'text') {
                closeCurrentBlock();
                const idx = assignContentBlockIndex();
                encoder('content_block_start', {
                  type: 'content_block_start',
                  index: idx,
                  content_block: {
                    type: 'text',
                    text: ''
                  }
                });
                currentContentBlockIndex = idx;
                currentBlockType = 'text';
              }

              encoder('content_block_delta', {
                type: 'content_block_delta',
                index: currentContentBlockIndex,
                delta: {
                  type: 'text_delta',
                  text: delta.content
                }
              });
            }

            // [Fix 1 continuation: Then process Tool Calls]
            if (delta.tool_calls && delta.tool_calls.length > 0) {
              for (const tc of delta.tool_calls) {
                toolDeltaChunks++;
                const toolIndex = tc.index || 0;
                let state = toolStates.get(toolIndex);

                const tcID = (tc.id || '').trim() || `call_${Date.now()}_${toolIndex}`;
                const tcName = (tc.function?.name || '').trim() || `tool_${toolIndex}`;

                if (!state) {
                  // This is a new tool call, close the previous block (text or previous tool)
                  closeCurrentBlock();
                  const idx = assignContentBlockIndex();
                  state = { contentBlockIndex: idx, id: tcID, name: tcName };
                  toolStates.set(toolIndex, state);

                  encoder('content_block_start', {
                    type: 'content_block_start',
                    index: idx,
                    content_block: {
                      type: 'tool_use',
                      id: state.id,
                      name: state.name,
                      input: {}
                    }
                  });

                  currentContentBlockIndex = idx;
                  currentBlockType = 'tool_use';
                } else {
                  // 恢复写入已存在的工具块
                  if (!state.id && tc.id) state.id = tc.id;
                  if (!state.name && tc.function?.name) state.name = tc.function.name;
                  currentContentBlockIndex = state.contentBlockIndex;
                  currentBlockType = 'tool_use';
                }

                const argsPart = tc.function?.arguments || '';
                if (argsPart) {
                  toolArgsChars += argsPart.length;
                  encoder('content_block_delta', {
                    type: 'content_block_delta',
                    index: state.contentBlockIndex,
                    delta: {
                      type: 'input_json_delta',
                      partial_json: argsPart
                    }
                  });
                }
              }
            }

            // [Handle Finish Reason]
            if (chunkData.choices[0].finish_reason) {
              finishReason = chunkData.choices[0].finish_reason;
              const stopReason = mapFinishReason(finishReason);

              closeCurrentBlock();

              encoder('message_delta', {
                type: 'message_delta',
                delta: {
                  stop_reason: stopReason,
                  stop_sequence: null
                },
                usage: {
                  output_tokens: 0
                }
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });

      upRes.on('end', () => {
        closeCurrentBlock();

        if (!finishReason) {
          encoder('message_delta', {
            type: 'message_delta',
            delta: {
              stop_reason: 'end_turn',
              stop_sequence: null
            },
            usage: {
              output_tokens: 0
            }
          });
        }

        encoder('message_stop', { type: 'message_stop' });

        if (cfg.logStreamPreviewMax > 0) {
          console.log(`[${reqID}] stream summary chunks=${chunkCount} text_chars=${textChars} tool_delta_chunks=${toolDeltaChunks} tool_args_chars=${toolArgsChars} finish_reason="${finishReason}" saw_done=${sawDone} preview="${preview}"`);
        } else {
          console.log(`[${reqID}] stream summary chunks=${chunkCount} text_chars=${textChars} tool_delta_chunks=${toolDeltaChunks} tool_args_chars=${toolArgsChars} finish_reason="${finishReason}" saw_done=${sawDone}`);
        }

        res.end();

        resolve();
      });

      upRes.on('error', (err) => {
        writeJSONError(res, 502, 'upstream_request_failed');
        reject(err);
      });
    });

    upReq.on('error', (err) => {
      writeJSONError(res, 502, 'upstream_request_failed');
      reject(err);
    });

    upReq.write(bodyBytes);
    upReq.end();
  });
}

// Log forwarded request
function logForwardedRequest(reqID, cfg, anthropicReq, openaiReq) {
  const inSummary = {
    model: anthropicReq.model,
    max_tokens: anthropicReq.max_tokens,
    stream: anthropicReq.stream,
    messages: anthropicReq.messages?.length || 0,
    tools: anthropicReq.tools?.length || 0
  };
  console.log(`[${reqID}] inbound summary=${mustJSONTrunc(inSummary, cfg.logBodyMax)}`);

  const out = sanitizeOpenAIRequest(openaiReq);
  console.log(`[${reqID}] forward url=${cfg.upstreamURL}`);
  console.log(`[${reqID}] forward headers=${mustJSONTrunc({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <redacted>'
  }, cfg.logBodyMax)}`);
  console.log(`[${reqID}] forward body=${mustJSONTrunc(out, cfg.logBodyMax)}`);
}

// Log forwarded upstream body
function logForwardedUpstreamBody(reqID, cfg, body) {
  if (cfg.logBodyMax === 0) return;

  let s = typeof body === 'string' ? body : body.toString();
  if (s.length > cfg.logBodyMax) {
    s = s.substring(0, cfg.logBodyMax) + '...(truncated)';
  }
  console.log(`[${reqID}] upstream body=${s}`);
}

// Truncate JSON for logging
function mustJSONTrunc(v, maxChars) {
  try {
    const b = JSON.stringify(v);
    if (maxChars === 0) return '(disabled)';
    if (b.length > maxChars) {
      return b.substring(0, maxChars) + '...(truncated)';
    }
    return b;
  } catch (e) {
    return `{"_error":"json_marshal_failed","detail":"${e.message}"}`;
  }
}

// Sanitize OpenAI request for logging
function sanitizeOpenAIRequest(req) {
  const out = { ...req };
  out.messages = sanitizeOpenAIMessages(req.messages);
  out.tools = sanitizeAnySlice(req.tools);
  return out;
}

// Sanitize OpenAI messages
function sanitizeOpenAIMessages(msgs) {
  if (!msgs || msgs.length === 0) return null;

  return msgs.map(m => {
    if (typeof m !== 'object' || m === null) return m;

    const cp = { ...m };
    if (cp.content) {
      cp.content = sanitizeMessageContent(cp.content);
    }
    if (cp.tool_calls) {
      cp.tool_calls = sanitizeAny(cp.tool_calls);
    }
    return cp;
  });
}

// Sanitize message content
function sanitizeMessageContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(p => {
      if (typeof p !== 'object' || p === null) return p;

      const cp = { ...p };
      if (cp.type === 'image_url' && cp.image_url && typeof cp.image_url === 'object') {
        const iu = { ...cp.image_url };
        if (iu.url && typeof iu.url === 'string' && iu.url.startsWith('data:')) {
          iu.url = 'data:<redacted>';
        }
        cp.image_url = iu;
      }
      return cp;
    });
  }
  return sanitizeAny(content);
}

// Sanitize any slice
function sanitizeAnySlice(v) {
  if (!v || v.length === 0) return null;
  return v.map(item => sanitizeAny(item));
}

// Sanitize any value
function sanitizeAny(v) {
  if (typeof v !== 'object' || v === null) return v;
  if (Array.isArray(v)) return sanitizeAnySlice(v);

  const cp = {};
  for (const [k, vv] of Object.entries(v)) {
    cp[k] = sanitizeAny(vv);
  }
  return cp;
}

// Handle messages endpoint
async function handleMessages(req, res, cfg) {
  const reqID = `req_${Date.now()}`;

  if (cfg.serverAPIKey && !checkInboundAuth(req, cfg.serverAPIKey)) {
    console.log(`[${reqID}] inbound unauthorized`);
    writeJSONError(res, 401, 'unauthorized');
    return;
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
  }

  let anthropicReq;
  try {
    anthropicReq = JSON.parse(body);
  } catch (err) {
    console.log(`[${reqID}] invalid inbound json: ${err.message}`);
    writeJSONError(res, 400, 'invalid_json');
    return;
  }

  if (!anthropicReq.model?.trim()) {
    console.log(`[${reqID}] missing model`);
    writeJSONError(res, 400, 'missing_model');
    return;
  }

  if (!anthropicReq.max_tokens) {
    anthropicReq.max_tokens = 1024;
  }

  let openaiReq;
  try {
    openaiReq = convertAnthropicToOpenAI(anthropicReq);
  } catch (err) {
    console.log(`[${reqID}] request conversion failed: ${err.message}`);
    writeJSONError(res, 400, 'request_conversion_failed');
    return;
  }

  logForwardedRequest(reqID, cfg, anthropicReq, openaiReq);

  if (anthropicReq.stream) {
    try {
      await proxyStream(res, req, cfg, reqID, openaiReq);
    } catch (err) {
      console.log(`[${reqID}] stream proxy error: ${err.message}`);
    }
    return;
  }

  try {
    const { body: openaiRespBody, res: upRes } = await doUpstreamJSON(req, cfg, openaiReq);
    console.log(`[${reqID}] upstream status=${upRes.statusCode}`);

    if (upRes.statusCode < 200 || upRes.statusCode >= 300) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(upRes.statusCode);
      res.end(openaiRespBody);
      logForwardedUpstreamBody(reqID, cfg, openaiRespBody);
      return;
    }

    let openaiResp;
    try {
      openaiResp = JSON.parse(openaiRespBody.toString());
    } catch (err) {
      console.log(`[${reqID}] invalid upstream json: ${err.message}`);
      logForwardedUpstreamBody(reqID, cfg, openaiRespBody);
      writeJSONError(res, 502, 'invalid_upstream_json');
      return;
    }

    const anthropicResp = convertOpenAIToAnthropic(openaiResp);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(anthropicResp));
  } catch (err) {
    console.log(`[${reqID}] upstream request failed: ${err.message}`);
    writeJSONError(res, 502, 'upstream_request_failed');
  }
}

// Main server
function main() {
  try {
    loadConfig();
  } catch (err) {
    console.error(`config error: ${err.message}`);
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);

    // Handle CORS requests (Claude Code terminal tool and browser SDK may both use this)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Ignore Query parameters in URL
    const urlPath = req.url.split('?')[0];

    if (req.method === 'POST' && urlPath === '/v1/messages') {
      await handleMessages(req, res, config);
    } else if (req.method === 'GET' && urlPath === '/') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'claude-nvidia-proxy',
        health: 'ok'
      }));
    } else {
      // Must return standard Anthropic format error, never return 200 OK for unknown routes
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(404);
      res.end(JSON.stringify({
        type: 'error',
        error: {
          type: 'not_found_error',
          message: `Route not found: ${req.method} ${urlPath}`
        }
      }));
    }
  });

  console.log(`listening on ${config.addr}`);
  console.log(`upstream: ${config.upstreamURL}`);
  if (config.serverAPIKey) {
    console.log('inbound auth: enabled');
  } else {
    console.log('inbound auth: disabled (SERVER_API_KEY not set)');
  }

  const [host, port] = config.addr.split(':');
  server.listen(parseInt(port), host);
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  loadConfig,
  checkInboundAuth,
  convertAnthropicToOpenAI,
  convertOpenAIToAnthropic,
  handleMessages,
  proxyStream,
  main
};
