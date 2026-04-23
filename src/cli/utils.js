import { createInterface } from 'readline';
import process from 'process';

export async function keySelect(options) {
  const { items, title = 'Select an option' } = options;
  const { stdin, stdout } = process;

  if (!stdin.isTTY) {
    return keySelectNumber({ items, title });
  }

  let selectedIndex = 0;

  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout });

    function render() {
      stdout.write('\x1b[2J\x1b[0f');
      stdout.write('\n');
      stdout.write(title + '\n\n');
      stdout.write('\x1b[90m  Use ↑/↓ to select, Enter to confirm, Ctrl+C to cancel\x1b[0m\n\n');
      items.forEach((item, i) => {
        const marker = i === selectedIndex ? '\x1b[32m▶\x1b[0m ' : '  ';
        stdout.write(`${marker}${item}\n`);
      });
      stdout.write('\n');
    }

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf-8');

    const cleanup = () => {
      stdin.setRawMode(false);
      rl.close();
    };

    stdin.on('keypress', (char, key) => {
      if (key.name === 'up') {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
      } else if (key.name === 'down') {
        selectedIndex = Math.min(items.length - 1, selectedIndex + 1);
        render();
      } else if (key.name === 'return') {
        cleanup();
        stdout.write('\n');
        resolve(items[selectedIndex]);
      } else if (key.name === 'c' && key.ctrl) {
        cleanup();
        stdout.write('\n\x1b[90mCancelled\x1b[0m\n');
        process.exit(0);
      }
    });

    render();
  });
}

async function keySelectNumber(options) {
  const { items, title } = options;
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n${title}:\n`);
  items.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item}`);
  });

  return new Promise(resolve => {
    rl.question(`\nSelect [1-${items.length}]: `, answer => {
      rl.close();
      const index = parseInt(answer.trim()) - 1;
      if (isNaN(index) || index < 0 || index >= items.length) {
        console.log('Invalid selection, using first option.');
        resolve(items[0]);
      } else {
        resolve(items[index]);
      }
    });
  });
}