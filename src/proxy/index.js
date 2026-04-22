import http from 'http';
import https from 'https';
import { URL } from 'url';
import { writeJSONError, logForwardedUpstreamBody } from '../utils/index.js';
import { mapFinishReason } from '../converter/index.js';
import { getLogger } from '../logger/index.js';

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

async function proxyStream(res, req, cfg, reqID, openaiReq) {
  const logger = getLogger();
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
      logger.logInfo(`[${reqID}] upstream status=${upRes.statusCode} (stream)`);

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

            if (delta.content !== undefined && delta.content !== null && delta.content !== "") {
              textChars += delta.content.length;
              if (cfg.logStreamPreviewMax > 0 && preview.length < cfg.logStreamPreviewMax) {
                preview += delta.content.substring(0, cfg.logStreamPreviewMax - preview.length);
              }

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

            if (delta.tool_calls && delta.tool_calls.length > 0) {
              for (const tc of delta.tool_calls) {
                toolDeltaChunks++;
                const toolIndex = tc.index || 0;
                let state = toolStates.get(toolIndex);

                const tcID = (tc.id || '').trim() || `call_${Date.now()}_${toolIndex}`;
                const tcName = (tc.function?.name || '').trim() || `tool_${toolIndex}`;

                if (!state) {
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
          logger.logInfo(`[${reqID}] stream summary chunks=${chunkCount} text_chars=${textChars} tool_delta_chunks=${toolDeltaChunks} tool_args_chars=${toolArgsChars} finish_reason="${finishReason}" saw_done=${sawDone} preview="${preview}"`);
        } else {
          logger.logInfo(`[${reqID}] stream summary chunks=${chunkCount} text_chars=${textChars} tool_delta_chunks=${toolDeltaChunks} tool_args_chars=${toolArgsChars} finish_reason="${finishReason}" saw_done=${sawDone}`);
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

export { doUpstreamJSON, proxyStream };