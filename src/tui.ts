import blessed from 'blessed';
import type { Widgets } from 'blessed';
import { ChatApp, LOBBY } from './app';
import { handleLine } from './commands';

const ROOM_ENTER_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function showRoomEnter(screen: Widgets.Screen, room: string): Promise<void> {
  const overlay = blessed.box({
    top: 'center',
    left: 'center',
    width: 32,
    height: 5,
    border: 'line',
    tags: true,
    style: { border: { fg: 'cyan' } },
    content: `{cyan-fg}now entering:{/} ${room}`,
  });

  const bar = blessed.progressbar({
    top: 3,
    left: 1,
    width: '100%-2',
    height: 1,
    ch: '█',
    filled: 0,
  });

  overlay.append(bar);
  screen.append(overlay);
  screen.render();

  const frames = 10;
  for (let i = 1; i <= frames; i++) {
    bar.setProgress((i / frames) * 100);
    screen.render();
    await sleep(ROOM_ENTER_MS / frames);
  }

  overlay.destroy();
}

function showHistory(log: Widgets.Log, app: ChatApp, lines: string[]): void {
  log.setContent('');

  const inLobby = app.getRoom() === LOBBY;
  if (inLobby || lines.length === 0) {
    log.log('{cyan-fg}connected{/cyan-fg} — /help');
  }

  for (const line of lines) {
    log.log(line);
  }
}

export async function startTui(app: ChatApp): Promise<void> {
  const screen = blessed.screen({ smartCSR: true, title: `#${app.getRoom()}` });

  const log = blessed.log({
    top: 0,
    left: 0,
    width: '100%',
    height: '85%',
    border: 'line',
    tags: true,
    label: ' frostchat ',
  });

  const input = blessed.textbox({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: 'line',
    inputOnFocus: true,
    label: ` /${app.getRoom()} `,
  });

  screen.append(log);
  screen.append(input);

  showHistory(log, app, await app.getRoomLines());

  input.focus();

  const syncRoom = () => {
    const room = app.getRoom();
    screen.title = `#${room}`;
    input.setLabel(` /${room} `);
  };

  syncRoom();

  input.on('submit', async (value) => {
    const result = await handleLine(app, value);
    input.clearValue();

    if (result.enterRoom) {
      syncRoom();
      log.setContent('');
      screen.render();
      await showRoomEnter(screen, result.enterRoom);
      showHistory(log, app, result.lines);
    } else {
      for (const line of result.lines) {
        log.log(line);
      }
    }

    syncRoom();
    screen.render();
    input.focus();

    if (result.quit) {
      process.exit(0);
    }
  });

  screen.key(['C-c'], () => process.exit(0));
  screen.render();
}
