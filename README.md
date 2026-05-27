# FrostChat

Terminal-first, old-internet-style, local-first chat with append-only events.

## Stack
- TypeScript + Node.js
- Version A: simple CLI loop
- Version B: nostalgic terminal TUI via blessed
- JSONL/local JSON persistence (SQLite-swappable storage interface)
- Mock P2P transport abstraction

## Commands
- `/help`
- `/nick <name>`
- `/room <room>`
- `/msg <message>`
- `/history`
- `/upload <path>`
- `/files`
- `/quit`

## Run
```bash
npm install
npm run dev      # Version A (CLI)
npm run tui      # Version B (blessed TUI)
```

## Architecture
- `src/client` CLI/TUI layer
- `src/core` domain/events/commands/parser
- `src/storage` storage interfaces + JSONL driver
- `src/p2p` transport abstraction + mock
- `src/files` file metadata helpers
- `src/identity` local identity keypair generation
