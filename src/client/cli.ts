import readline from 'node:readline';
import { ChatApp } from '../core/chatApp';
import { parseCommand } from '../core/commands';
import { runCommand } from '../core/commandHandler';

export function startCli(app: ChatApp): void {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
  console.log('Welcome to FrostChat. Type /help for commands.');
  rl.prompt();
  rl.on('line', async (line) => {
    const cmd = parseCommand(line);
    if (!cmd) {
      console.log('Commands must start with / and be valid. Try /help.');
      rl.prompt();
      return;
    }
    const result = await runCommand(app, cmd);
    result.output.forEach((entry) => console.log(entry));
    if (result.shouldQuit) {
      rl.close();
      process.exit(0);
    }
    rl.prompt();
  });
}
