import readline from 'node:readline';
import { ChatApp } from '../core/chatApp';

export function startCli(app: ChatApp): void {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
  console.log('Welcome to FrostChat. Type /help for commands.');
  rl.prompt();
  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) return rl.prompt();
    if (!input.startsWith('/')) { console.log('Commands must start with /. Try /msg <message>.'); rl.prompt(); return; }
    const [cmd, ...args] = input.split(' ');
    switch (cmd) {
      case '/help':
        console.log('/help /nick <name> /room <room> /msg <message> /history /upload <path> /files /quit');
        break;
      case '/nick': console.log(await app.setNick(args.join(' '))); break;
      case '/room': console.log(await app.setRoom(args.join(' '))); break;
      case '/msg': await app.sendMessage(args.join(' ')); console.log('Message sent.'); break;
      case '/history': (await app.history()).forEach((entry) => console.log(entry)); break;
      case '/upload': console.log(`Uploaded ${ (await app.uploadFile(args.join(' '))).name }`); break;
      case '/files': (await app.listFiles()).forEach((f) => console.log(`${f.name} (${f.size} bytes)`)); break;
      case '/quit': rl.close(); process.exit(0);
      default: console.log('Unknown command.');
    }
    rl.prompt();
  });
}
