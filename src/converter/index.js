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

function joinTextBlocks(blocks) {
  const parts = [];
  for (const blk of blocks || []) {
    if (blk.type === 'text' && blk.text) {
      parts.push(blk.text);
    }
  }
  return parts.join('\n');
}

function convertAnthropicUserBlocksToOpenAIMessages(blocks) {
  const out = [];

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

function convertAnthropicToOpenAI(anthropicReq) {
  const messages = [];

  const systemText = extractSystemText(anthropicReq.system);
  if (systemText.trim()) {
    messages.push({
      role: 'system',
      content: systemText
    });
  }

  for (const m of anthropicReq.messages || []) {
    const role = (m.role || '').trim();
    if (!role) continue;

    const content = m.content;

    if (typeof content === 'string') {
      messages.push({
        role: role,
        content: content
      });
      continue;
    }

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

  if (anthropicReq.tool_choice) {
    openaiReq.tool_choice = convertToolChoice(anthropicReq.tool_choice);
  }

  return openaiReq;
}

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

export {
  convertAnthropicToOpenAI,
  convertOpenAIToAnthropic,
  mapFinishReason
};