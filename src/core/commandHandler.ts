import { ChatApp } from './chatApp';
import { ParsedCommand } from './commands';

export async function runCommand(app: ChatApp, cmd: ParsedCommand): Promise<{ output: string[]; shouldQuit: boolean }> {
  switch (cmd.name) {
    case 'help':
      return { output: ['/help /nick <name> /room <room> /msg <message> /history /upload <path> /files /quit'], shouldQuit: false };
    case 'nick':
      return { output: [await app.setNick(cmd.args)], shouldQuit: false };
    case 'room':
      return { output: [await app.setRoom(cmd.args)], shouldQuit: false };
    case 'msg':
      return { output: [await app.sendMessage(cmd.args)], shouldQuit: false };
    case 'history':
      return { output: await app.history(), shouldQuit: false };
    case 'upload':
      return { output: [`Uploaded ${(await app.uploadFile(cmd.args)).name}`], shouldQuit: false };
    case 'files':
      return { output: (await app.listFiles()).map((f) => `${f.name} (${f.size} bytes) ${f.mimeType}`), shouldQuit: false };
    case 'quit':
      return { output: ['Bye.'], shouldQuit: true };
  }
}
