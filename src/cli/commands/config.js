import readline from 'readline';
import { getLogger } from '../../logger/index.js';
import { configExists, getConfigPath, promptForConfig, writeConfigFile, readConfigFile } from '../../config/index.js';

export async function configCommand() {
  const logger = getLogger();

  try {
    if (configExists()) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('配置文件已存在，是否重新配置？(y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        logger.logInfo(`配置文件位置: ${getConfigPath()}`);
        const currentConfig = readConfigFile();
        console.log('当前配置:');
        console.log(JSON.stringify(currentConfig, null, 2));
        process.exit(0);
      }
    }

    logger.logInfo('开始交互式配置...');
    logger.logInfo(`配置文件将创建在: ${getConfigPath()}`);
    console.log('');

    const cfg = await promptForConfig();
    writeConfigFile(cfg);

    console.log('');
    logger.logInfo(`配置文件已创建: ${getConfigPath()}`);
    process.exit(0);

  } catch (err) {
    logger.logError(`配置失败: ${err.message}`);
    process.exit(1);
  }
}
