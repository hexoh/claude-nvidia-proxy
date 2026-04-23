import OpenAI from 'openai';
import readline from 'readline';
import { readConfigFile, readModelsFile } from '../../config/index.js';

const BASE_URL = 'https://integrate.api.nvidia.com/v1';

export async function testCommand(modelName) {
  const config = readConfigFile();
  
  if (!config?.NV_API_KEY) {
    console.error('Error: NV_API_KEY not configured. Run: cnp config');
    process.exit(1);
  }

  let selectedModel = modelName;
  
  if (!selectedModel) {
    const models = readModelsFile();
    
    if (models.length === 0) {
      console.error('Error: No models available. Run: cnp model add');
      process.exit(1);
    }

    console.log('Available models:');
    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model}`);
    });
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    selectedModel = await new Promise(resolve => {
      rl.question(`Select a model [1-${models.length}]: `, answer => {
        rl.close();
        const index = parseInt(answer.trim()) - 1;
        if (isNaN(index) || index < 0 || index >= models.length) {
          console.error('Invalid selection, using first model.');
          resolve(models[0]);
        } else {
          resolve(models[index]);
        }
      });
    });
  }

  console.log(`Testing model: ${selectedModel}`);
  console.log('');

  const openai = new OpenAI({
    apiKey: config.NV_API_KEY,
    baseURL: BASE_URL
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = await new Promise(resolve => {
    rl.question('Enter your prompt: ', resolve);
  });
  rl.close();

  if (!prompt.trim()) {
    console.error('Error: Prompt cannot be empty');
    process.exit(1);
  }

  console.log('');
  console.log('--- Response ---');
  console.log('');

  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: selectedModel,
    messages: [{ role: 'user', content: prompt.trim() }],
    temperature: 1,
    top_p: 1,
    max_tokens: 16384,
    stream: true
  });

  const responseTime = Date.now();
  let totalContent = '';

  for await (const chunk of completion) {
    const reasoning = chunk.choices[0]?.delta?.reasoning_content;
    if (reasoning) process.stdout.write(reasoning);
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
    totalContent += chunk.choices[0]?.delta?.content || '';
  }

  const endTime = Date.now();

  console.log('');
  console.log('');
  console.log('--- Time Stats ---');
  console.log(`API call latency: ${((responseTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Response generation: ${((endTime - responseTime) / 1000).toFixed(2)}s`);
  console.log(`Total time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Response length: ${totalContent.length} chars`);
}

export async function testHelpCommand() {
  console.log('Claude NVIDIA Proxy - Test Command');
  console.log('');
  console.log('Usage: cnp test [model]');
  console.log('');
  console.log('Description:');
  console.log('  Test an NVIDIA model with a prompt and measure response time.');
  console.log('');
  console.log('Options:');
  console.log('  model     Optional model name (e.g., z-ai/glm4.7)');
  console.log('');
  console.log('Examples:');
  console.log('  cnp test');
  console.log('  cnp test z-ai/glm4.7');
  console.log('');
}