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
        rl.question('Configuration file already exists, reconfigure? (y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        logger.logInfo(`Configuration file location: ${getConfigPath()}`);
        const currentConfig = readConfigFile();
        console.log('Current configuration:');
        console.log(JSON.stringify(currentConfig, null, 2));
        process.exit(0);
      }
    }

    logger.logInfo('Starting interactive configuration...');
    logger.logInfo(`Configuration file will be created at: ${getConfigPath()}`);
    console.log('');

    const cfg = await promptForConfig();
    writeConfigFile(cfg);

    console.log('');
    logger.logInfo(`Configuration file created: ${getConfigPath()}`);
    process.exit(0);

  } catch (err) {
    logger.logError(`Configuration failed: ${err.message}`);
    process.exit(1);
  }
}
