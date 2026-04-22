import http from 'http';
import { checkInboundAuth, writeJSONError, logForwardedRequest } from '../utils/index.js';
import { convertAnthropicToOpenAI, convertOpenAIToAnthropic } from '../converter/index.js';
import { doUpstreamJSON, proxyStream } from '../proxy/index.js';

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
      return;
    }

    let openaiResp;
    try {
      openaiResp = JSON.parse(openaiRespBody.toString());
    } catch (err) {
      console.log(`[${reqID}] invalid upstream json: ${err.message}`);
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

function createServer(cfg) {
  const server = http.createServer(async (req, res) => {
    console.log(`Received request: ${req.method} ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const urlPath = req.url.split('?')[0];

    if (req.method === 'POST' && urlPath === '/v1/messages') {
      await handleMessages(req, res, cfg);
    } else if (req.method === 'GET' && urlPath === '/') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        message: 'claude-nvidia-proxy',
        health: 'ok'
      }));
    } else {
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

  return server;
}

export { createServer, handleMessages };