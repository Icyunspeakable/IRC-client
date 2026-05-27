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

const names: CommandName[] = ['help', 'nick', 'room', 'msg', 'history', 'upload', 'files', 'quit'];

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const withoutSlash = trimmed.slice(1);
  const firstSpace = withoutSlash.indexOf(' ');
  const nameRaw = (firstSpace === -1 ? withoutSlash : withoutSlash.slice(0, firstSpace)).toLowerCase();
  if (!names.includes(nameRaw as CommandName)) return null;
  const args = firstSpace === -1 ? '' : withoutSlash.slice(firstSpace + 1).trim();
  return { name: nameRaw as CommandName, args };
}
