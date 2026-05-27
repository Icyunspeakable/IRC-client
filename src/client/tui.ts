import blessed from 'blessed';
import { ChatApp } from '../core/chatApp';
import { parseCommand } from '../core/commands';
import { runCommand } from '../core/commandHandler';

export function startTui(app: ChatApp): void {
  const screen = blessed.screen({ smartCSR: true, title: 'FrostChat' });
  const log = blessed.log({ top: 0, left: 0, width: '100%', height: '85%', border: 'line', tags: true, label: ' FrostChat ' });
  const input = blessed.textbox({ bottom: 0, left: 0, width: '100%', height: 3, border: 'line', inputOnFocus: true, label: ` /${app.getCurrentRoom()} ` });
  screen.append(log); screen.append(input);
  log.log('{cyan-fg}Old internet mode.{/cyan-fg} Type /help');
  input.focus();

  const refreshLabel = () => input.setLabel(` /${app.getCurrentRoom()} `);

  input.on('submit', async (value) => {
    const cmd = parseCommand(value);
    if (!cmd) {
      log.log('{red-fg}Invalid command. Use /help{/red-fg}');
    } else {
      const result = await runCommand(app, cmd);
      result.output.forEach((line) => log.log(line));
      refreshLabel();
      if (result.shouldQuit) process.exit(0);
    }
    input.clearValue();
    screen.render();
    input.focus();
  });

  screen.key(['C-c'], () => process.exit(0));
  screen.render();
}
