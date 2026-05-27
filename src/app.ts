import path from 'node:path';
import { mkdir, copyFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { createEvent } from './events';
import { Identity } from './identity';
import { AppState, FileRecord, guessMimeType, Storage } from './storage';

export const LOBBY = 'lobby';

export class ChatApp {
  private room = LOBBY;
  private nickname: string;

  constructor(
    private storage: Storage,
    private identity: Identity,
  ) {
    this.nickname = identity.nickname;
  }

  async init(): Promise<void> {
    await this.storage.ensure();
    const saved = await this.storage.getState();
    if (saved) {
      this.room = saved.currentRoom;
      this.nickname = saved.nickname;
    }
  }

  getRoom(): string {
    return this.room;
  }

  getNick(): string {
    return this.nickname;
  }

  getRoomIntro(): string[] {
    if (this.room !== LOBBY) return [];
    return [
      `you are currently logged in as: ${this.nickname}`,
      'use /room <name> to join a channel, /help for commands',
    ];
  }

  async getRoomLines(): Promise<string[]> {
    return [...this.getRoomIntro(), ...(await this.getHistory())];
  }

  private state(): AppState {
    return { currentRoom: this.room, nickname: this.nickname };
  }

  private async persistState(): Promise<void> {
    await this.storage.saveState(this.state());
  }

  async setNick(name: string): Promise<void> {
    this.nickname = name.trim();
    await this.persistState();
  }

  async setRoom(roomId: string): Promise<void> {
    this.room = roomId.trim();
    await this.persistState();
  }

  async sendMessage(text: string): Promise<string> {
    const event = createEvent({
      roomId: this.room,
      authorPublicKey: this.identity.publicKey,
      authorNickname: this.nickname,
      type: 'message',
      payload: { text: text.trim() },
    });
    await this.storage.appendEvent(event);
    return formatEventLine(event);
  }

  async getHistory(): Promise<string[]> {
    const events = await this.storage.getEventsByRoom(this.room);
    return events.map(formatEventLine);
  }

  async uploadFile(inputPath: string): Promise<FileRecord> {
    const source = path.resolve(inputPath);
    const info = await stat(source);
    const name = path.basename(source);
    const fileId = await sha256File(source);

    const attachmentsDir = path.join(process.cwd(), '.localdata', 'attachments');
    await mkdir(attachmentsDir, { recursive: true });

    const localPath = path.join(attachmentsDir, `${fileId}-${name}`);
    await copyFile(source, localPath);

    const record: FileRecord = {
      fileId,
      name,
      size: info.size,
      mimeType: guessMimeType(name),
      localPath,
      createdAt: new Date().toISOString(),
      roomId: this.room,
    };

    await this.storage.saveFileRecord(record);
    await this.storage.appendEvent(
      createEvent({
        roomId: this.room,
        authorPublicKey: this.identity.publicKey,
        authorNickname: this.nickname,
        type: 'file',
        payload: record,
      }),
    );

    return record;
  }

  async listFiles(): Promise<FileRecord[]> {
    return this.storage.getFileRecords(this.room);
  }
}

function formatEventLine(event: { createdAt: string; authorNickname: string; type: string; payload: unknown }): string {
  const payload = event.payload as { text?: string; name?: string } | null;
  const body = payload?.text ?? payload?.name ?? event.type;
  return `[${event.createdAt}] ${event.authorNickname}: ${body}`;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}
