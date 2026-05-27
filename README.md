# frostchat

Terminal chat that saves everything locally. Rooms, messages, and file uploads land in `.localdata/` as JSON.

## run it

```bash
npm install
npm run dev      # blessed terminal UI (default)
npm run cli      # plain readline fallback
```

## commands

Everything starts with `/`:

```
/help  /nick <name>  /room <room>  /msg <text>
/history  /upload <path>  /files  /quit
```

## layout

```
src/
  app.ts       chat logic
  commands.ts  slash command parsing + dispatch
  storage.ts   jsonl persistence
  events.ts    event types
  identity.ts  local peer id (random keys for now)
  cli.ts       readline front-end
  tui.ts       blessed front-end
  index.ts     entry point
```

P2P sync isn't wired up yet — this is single-machine local-first for now.

See [docs/SPEC.md](docs/SPEC.md) for the full project spec and roadmap.
