# FrostChat (MVP)

Terminal-first, old-internet-style, local-first chat with append-only events.

## Stack
- TypeScript + Node.js
- CLI command loop (TUI-ready architecture)
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
npm run dev
```

## Architecture
- `src/client` CLI layer
- `src/core` domain/events/commands
- `src/storage` storage interfaces + JSONL driver
- `src/p2p` transport abstraction + mock
- `src/files` future chunking/hashing expansion
- `src/identity` local identity keypair generation
