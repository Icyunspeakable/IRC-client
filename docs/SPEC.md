# frostchat — project spec

Terminal-first, old-internet chat in the spirit of IRC, irssi, and WeeChat, but serverless. No central chat host. Peers talk directly and each peer keeps its own local database.

Package name: `frostchat`. MIT licensed, copyright Icyunspeakable and contributors. Currently a private project, planned to go open source once it's in a presentable state.

---

## Vision

A guiless, keyboard-driven TUI chat client that feels like the old internet but with modern niceties: synced rooms, persistent history, and file sharing, all without a hosted backend.

The non-negotiables:

- No central message server. Rooms are a shared naming convention between peers, not a service you deploy.
- P2P sync. Messages and file chunks travel peer to peer.
- Local-first. Your machine always has a full copy of what you've seen; the network is for sync, not authority.
- Local SQL database. Durable on-disk storage via SQLite (single file, cross-platform, easy to back up).
- Identity keypair per peer, used to sign events and identify users on the network.
- Content-addressed files. Uploads split into hashed chunks so transfers can dedupe and resume.

Aesthetic-wise: IRC vibes. Slash commands, channels, nicknames. Blessed TUI, cyan status lines, `#room` in the terminal tab title. No GUI framework, no mouse.

---

## What's done (Phase 1, local-only)

Phase 1 is the chat loop on a single machine. Nothing syncs over the network yet, but the shape is there.

Shipped:

- TypeScript on Node 20+, strict mode.
- Blessed TUI as the default UI. Readline CLI as a fallback (`--cli`).
- Append-only event log (JSONL for now).
- Rooms, nicknames, persistent state.
- All eight slash commands: `/help`, `/nick`, `/room`, `/msg`, `/history`, `/upload`, `/files`, `/quit`.
- File uploads copy into a local attachments dir with metadata.
- Lobby welcome and room-enter animation.
- Unit tests for the parser, event creation, and storage/app integration.
- Cross-platform file I/O via Node's `path`, `fs/promises`, `crypto`, and streams.

Not in Phase 1 (on purpose):

- P2P transport. Nothing on the wire yet.
- SQLite. JSONL is a placeholder until the schema stops moving.
- Event signing. Identity exists but signatures don't.
- File chunking.
- Edit, delete, and system event types.

### Current layout

```
src/
  app.ts        ChatApp: rooms, messages, uploads
  commands.ts   slash command parsing, dispatch, user-facing strings
  storage.ts    Storage interface and JsonlStorage (interim)
  events.ts     ChatEvent type and createEvent()
  identity.ts   local identity (stub keys for now)
  tui.ts        blessed front-end (default)
  cli.ts        readline front-end
  index.ts      bootstrap
tests/
docs/
  SPEC.md
```

Data on disk lives under `.localdata/`: `events.jsonl` for the chat log, `state.json` for current room and nickname, `identity.json` for the local peer, `files.json` for upload metadata, and `attachments/` for the copied files themselves.

---

## Target architecture

```
┌─────────────┐     ┌─────────────┐
│   Peer A    │◄───►│   Peer B    │
│  TUI/CLI    │     │  TUI/CLI    │
│  ChatApp    │     │  ChatApp    │
│  SQLite     │     │  SQLite     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────── P2P ────────┘
        (libp2p or Hyperswarm)
```

Each peer is the same app. There is no server.

The layers as I'm thinking about them:

`tui.ts` / `cli.ts` handle input and rendering. No business logic. `commands.ts` parses slash commands and owns the user-facing strings. `app.ts` (`ChatApp`) is the orchestration layer: rooms, messages, files. `storage.ts` is persistence behind a `Storage` interface; today JSONL, eventually SQLite. A future `transport.ts` will handle publish/subscribe to peers. `identity.ts` will grow real keypair generation and event signing. File chunking will probably live in its own module once it exists; for now it's part of `app.ts`.

The `Storage` interface already exists, which is the one bit of "future-proofing" I'm keeping. Swapping JSONL for SQLite should be one file's worth of work.

---

## Roadmap

### Now: Phase 2, P2P sync

The big one. Goal is two local processes in the same room seeing each other's messages.

1. Add a minimal `Transport` interface: `publish(event)`, `subscribe(handler)`. That's it.
2. Wire it into `ChatApp`: outgoing events broadcast, incoming events append to storage.
3. Start with a loopback or LAN mock so the wiring is testable.
4. Pick a real library. The two real candidates are libp2p and Hyperswarm (Holepunch). Hyperswarm looks simpler; libp2p is more capable but heavier. TODO: actually prototype both before committing.
5. Room and peer discovery. Probably invite codes or manual peer addresses to start. DHT eventually.

### Next: Phase 3, SQLite and signing

Once sync works, JSONL is going to hurt. Time to switch.

- Schema: events, files, peers, sync cursor. Index events by `(roomId, createdAt)`.
- Implement `SqliteStorage` behind the existing `Storage` interface.
- Migration path from JSONL. Probably a one-shot import on first run.
- Real identity: ed25519 keypair.
- Sign every outgoing event. Verify on ingest. Reject events that don't verify.

### Later

- File chunking. Split uploads into content-addressed chunks, store the hashes in the file event, transfer chunks over the transport, reassemble and verify on download.
- Edit and delete as new signed events that reference the original event id. The log is still append-only.
- System events (join, leave, part).
- Bare-text input mode so you can type `hello` instead of `/msg hello`.
- Maybe Ink instead of blessed, if blessed ever becomes painful. Not a priority.

---

## Event model

Right now a `ChatEvent` looks like this:

```typescript
{
  id: string
  roomId: string
  authorPublicKey: string
  authorNickname: string
  createdAt: string        // ISO 8601
  type: 'message' | 'file'
  payload: unknown
}
```

Once signing lands, the shape grows a `signature` field and the type union picks up `edit`, `delete`, and `system`:

```typescript
{
  id: string
  roomId: string
  authorPublicKey: string
  authorNickname: string
  createdAt: string
  type: 'message' | 'file' | 'edit' | 'delete' | 'system'
  payload: unknown
  signature: string
}
```

Events are append-only. Edits and deletes are new events that point at the original id. The log is never rewritten.

File event payload, once chunking exists:

```typescript
{
  fileId: string          // content hash
  name: string
  size: number
  mimeType: string
  chunkHashes: string[]
}
```

---

## Commands

All input is slash-prefixed for now.

| Command | What it does |
|---------|----------|
| `/help` | List commands |
| `/nick <name>` | Set display nickname |
| `/room <room>` | Switch room. TUI shows a quick enter animation. |
| `/msg <text>` | Send a message |
| `/history` | Show room history |
| `/upload <path>` | Upload a file to the current room |
| `/files` | List files in the current room |
| `/quit` | Exit |

Default room is `lobby`, which shows a welcome line with your current nickname.

---

## Stack

TypeScript on Node 20+. Strict mode. The TUI is blessed; Ink is on the "if it matters later" list. The CLI fallback is just `readline`.

Storage is JSONL right now and SQLite eventually, probably via `better-sqlite3` for the native speed boost, with `sql.js` as a fallback if the native build is a pain on Windows. P2P is undecided between libp2p and Hyperswarm. Crypto will be ed25519 (or whatever Node ships in `crypto.sign` by then) once signing matters.

Tests run on vitest. Dev runs through `tsx`.

---

## Cross-platform

Must work on Linux and Windows. Some specifics:

- Always use Node's `path`, `fs/promises`, `crypto`, and stream APIs. Never shell out to `cp`, `mv`, `sha256sum`, or `file`.
- No hardcoded `/` paths. `path.join` everywhere.
- The terminal should behave in Windows Terminal, PowerShell, CMD, and ordinary Linux terminals.
- npm scripts stay cross-platform (use `rimraf` instead of `rm -rf` when something like that is needed).
- The SQLite driver has to ship prebuilt binaries for both platforms or fall back to pure JS.

---

## `.gitignore` policy

Things that should stay local:

- `node_modules/` and package manager caches
- `dist/`, `build/`, `out/`, `coverage/`
- `.env` and `.env.*` (keep `.env.example` if it ever exists)
- logs
- `.localdata/` (events, state, identity, attachments)
- SQLite files: `*.db`, `*.sqlite`
- generated keys
- OS and editor junk: `.DS_Store`, `.vscode/`, etc.

---

## Implementation preferences

A few rules I'm trying to hold to:

- Make the core work before touching the network. Phase 1 was about that.
- The UI knows nothing about the domain. `ChatApp` should never import blessed.
- Keep diffs small and focused. One concern per commit when possible.
- Storage stays behind an interface so JSONL → SQLite is a swap, not a rewrite.
- Don't add modules until something actually imports them. The first cleanup pass deleted a lot of premature scaffolding and I'd like not to regrow it.
- Tests should cover real behavior, not the existence of types.

---

## UX decisions (Phase 1)

- The TUI is the default entrypoint. `npm run dev` opens blessed.
- The terminal tab title shows `#room`, e.g. `#lobby`.
- Lobby opens with a cyan `connected — /help` line and a short welcome with the current nickname.
- `/room <name>` triggers a brief "now entering: name" overlay with a progress bar (~200ms), then the room's history loads.
- `/msg` echoes the sent line immediately in the TUI. No more sending into the void.
- The input box label tracks the current room (`/lobby`, `/dev`, etc).

---

## TODO

A few things that aren't decided yet:

- **Room discovery.** Without a server, how do peers find each other? Probably invite codes or manual peer addresses to start. DHT later if it makes sense.
- **Room membership.** Is any room name effectively global once two peers agree on it, or is there a notion of invite-only? Leaning toward "rooms are just names" for simplicity.
- **SQLite driver.** `better-sqlite3` is fast and synchronous but ships native code. `sql.js` is WASM and zero-dep but slower. The Windows story matters here.
- **P2P library.** Hyperswarm is appealing for simplicity. libp2p is appealing for being the obvious "industry standard." Need to actually try both.
- **Clock skew and conflict resolution.** Append-only helps a lot, but ordering across peers is still a real problem. Open for now.
