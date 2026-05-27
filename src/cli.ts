import readline from 'node:readline';
import { ChatApp } from './app';
import { handleLine } from './commands';

export function startCli(app: ChatApp): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  console.log('frostchat — /help for commands');
  rl.prompt();

  rl.on('line', async (line) => {
    const result = await handleLine(app, line);
    for (const text of result.lines) {
      console.log(text);
    }
    if (result.quit) {
      rl.close();
      process.exit(0);
    }
    rl.prompt();
  });
}
