import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'your-secret-key',
  baseURL: 'https://integrate.api.nvidia.com/v1', // https://integrate.api.nvidia.com/v1
})
 
async function main() {
  const startTime = Date.now();
  
  const completion = await openai.chat.completions.create({
    model: "z-ai/glm4.7",
    // model: "z-ai/glm5",
    // model: "minimaxai/minimax-m2.7",
    messages: [{"role":"user","content":"你好，请介绍一下自己"}],
    temperature: 1,
    top_p: 1,
    max_tokens: 16384,
    chat_template_kwargs: {"enable_thinking":true,"clear_thinking":false},
    stream: true
  })
   
  const responseTime = Date.now();
  let totalContent = '';
  
  for await (const chunk of completion) {
        const reasoning = chunk.choices[0]?.delta?.reasoning_content;
    if (reasoning) process.stdout.write(reasoning);
        process.stdout.write(chunk.choices[0]?.delta?.content || '')
        totalContent += chunk.choices[0]?.delta?.content || '';
  }
   
  const endTime = Date.now();
  
  console.error('\n--- 时间统计 ---');
  console.error(`API 调用耗时: ${((responseTime - startTime) / 1000).toFixed(2)}s`);
  console.error(`响应生成耗时: ${((endTime - responseTime) / 1000).toFixed(2)}s`);
  console.error(`总耗时: ${((endTime - startTime) / 1000).toFixed(2)}s`);
}

main();