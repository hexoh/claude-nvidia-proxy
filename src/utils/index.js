import { getLogger } from '../logger/index.js';

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

function writeJSONError(res, status, code) {
  const errPayload = {
    type: 'error',
    error: {
      type: 'api_error',
      code: code,
      message: code
    }
  };
  if (res.headersSent) {
    try {
      res.write(`event: error\ndata: ${JSON.stringify(errPayload)}\n\n`);
      res.end();
    } catch (e) {
    }
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(errPayload));
}

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

function sanitizeAny(v) {
  if (typeof v !== 'object' || v === null) return v;
  if (Array.isArray(v)) return sanitizeAnySlice(v);

  const cp = {};
  for (const [k, vv] of Object.entries(v)) {
    cp[k] = sanitizeAny(vv);
  }
  return cp;
}

function sanitizeAnySlice(v) {
  if (!v || v.length === 0) return null;
  return v.map(item => sanitizeAny(item));
}

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

function sanitizeOpenAIRequest(req) {
  const out = { ...req };
  out.messages = sanitizeOpenAIMessages(req.messages);
  out.tools = sanitizeAnySlice(req.tools);
  return out;
}

function logForwardedRequest(reqID, cfg, anthropicReq, openaiReq) {
  const logger = getLogger();
  const inSummary = {
    model: anthropicReq.model,
    max_tokens: anthropicReq.max_tokens,
    stream: anthropicReq.stream,
    messages: anthropicReq.messages?.length || 0,
    tools: anthropicReq.tools?.length || 0
  };
  logger.logInfo(`[${reqID}] inbound summary=${mustJSONTrunc(inSummary, cfg.LOG_BODY_MAX)}`);

  const out = sanitizeOpenAIRequest(openaiReq);
  logger.logInfo(`[${reqID}] forward url=${cfg.API_BASE_URL}`);
  logger.logInfo(`[${reqID}] forward headers=${mustJSONTrunc({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <redacted>'
  }, cfg.LOG_BODY_MAX)}`);
  logger.logInfo(`[${reqID}] forward body=${mustJSONTrunc(out, cfg.LOG_BODY_MAX)}`);
}

function logForwardedUpstreamBody(reqID, cfg, body) {
  const logger = getLogger();
  if (cfg.LOG_BODY_MAX === 0) return;

  let s = typeof body === 'string' ? body : body.toString();
  if (s.length > cfg.LOG_BODY_MAX) {
    s = s.substring(0, cfg.LOG_BODY_MAX) + '...(truncated)';
  }
  logger.logInfo(`[${reqID}] upstream body=${s}`);
}

export {
  checkInboundAuth,
  writeJSONError,
  logForwardedRequest,
  logForwardedUpstreamBody
};