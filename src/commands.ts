import { ChatApp } from './app';

export type CommandName =
  | 'help'
  | 'nick'
  | 'room'
  | 'msg'
  | 'history'
  | 'upload'
  | 'files'
  | 'quit';

export interface ParsedCommand {
  name: CommandName;
  args: string;
}

export interface CommandResult {
  lines: string[];
  quit?: boolean;
  enterRoom?: string;
}

const COMMAND_NAMES: CommandName[] = [
  'help', 'nick', 'room', 'msg', 'history', 'upload', 'files', 'quit',
];

const HELP_TEXT =
  '/help  /nick <name>  /room <room>  /msg <text>  /history  /upload <path>  /files  /quit';

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const body = trimmed.slice(1);
  const space = body.indexOf(' ');
  const name = (space === -1 ? body : body.slice(0, space)).toLowerCase();

  if (!COMMAND_NAMES.includes(name as CommandName)) return null;

  const args = space === -1 ? '' : body.slice(space + 1).trim();
  return { name: name as CommandName, args };
}

export async function handleLine(app: ChatApp, input: string): Promise<CommandResult> {
  const cmd = parseCommand(input);
  if (!cmd) {
    return { lines: ['Unknown command. Type /help.'] };
  }
  return runCommand(app, cmd);
}

export async function runCommand(app: ChatApp, cmd: ParsedCommand): Promise<CommandResult> {
  switch (cmd.name) {
    case 'help':
      return { lines: [HELP_TEXT] };

    case 'nick': {
      if (!cmd.args.trim()) return { lines: ['Usage: /nick <name>'] };
      await app.setNick(cmd.args);
      return { lines: [`nick: ${cmd.args.trim()}`] };
    }

    case 'room': {
      if (!cmd.args.trim()) return { lines: ['Usage: /room <name>'] };
      const room = cmd.args.trim();
      await app.setRoom(room);
      return {
        lines: await app.getRoomLines(),
        enterRoom: room,
      };
    }

    case 'msg': {
      if (!cmd.args.trim()) return { lines: ['Usage: /msg <text>'] };
      const line = await app.sendMessage(cmd.args);
      return { lines: [line] };
    }

    case 'history':
      return { lines: await app.getRoomLines() };

    case 'upload': {
      if (!cmd.args.trim()) return { lines: ['Usage: /upload <path>'] };
      try {
        const file = await app.uploadFile(cmd.args);
        return { lines: [`uploaded ${file.name}`] };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'upload failed';
        return { lines: [`upload error: ${message}`] };
      }
    }

    case 'files': {
      const files = await app.listFiles();
      if (files.length === 0) return { lines: ['(no files in this room)'] };
      return {
        lines: files.map((f) => `${f.name}  ${f.size}b  ${f.mimeType}`),
      };
    }

    case 'quit':
      return { lines: ['bye'], quit: true };
  }
}
