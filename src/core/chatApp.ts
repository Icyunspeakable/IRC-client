import path from 'node:path';
import { mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createEvent } from './eventFactory';
import { StorageDriver, AppState, FileRecord } from '../storage/storage';
import { Identity } from '../identity/identity';

export class ChatApp {
  private currentRoom = 'lobby';
  private nickname: string;
  constructor(private storage: StorageDriver, private identity: Identity) {
    this.nickname = identity.nickname;
  }

  async init(): Promise<void> {
    await this.storage.ensure();
    const state = await this.storage.getState();
    if (state) {
      this.currentRoom = state.currentRoom;
      this.nickname = state.nickname;
    }
  }

  getState(): AppState { return { currentRoom: this.currentRoom, nickname: this.nickname }; }

  async setNick(name: string): Promise<string> {
    this.nickname = name;
    await this.storage.saveState(this.getState());
    return `Nickname set to ${name}`;
  }

  async setRoom(roomId: string): Promise<string> {
    this.currentRoom = roomId;
    await this.storage.saveState(this.getState());
    return `Switched to room ${roomId}`;
  }

  async sendMessage(text: string): Promise<void> {
    const event = createEvent({
      roomId: this.currentRoom,
      authorPublicKey: this.identity.publicKey,
      authorNickname: this.nickname,
      type: 'message',
      payload: { text },
    });
    await this.storage.appendEvent(event);
  }

  async history(): Promise<string[]> {
    const events = await this.storage.getEventsByRoom(this.currentRoom);
    return events.map((evt) => {
      const payload = evt.payload as { text?: string } | null;
      return `[${evt.createdAt}] ${evt.authorNickname}: ${String(payload?.text ?? evt.type)}`;
    });
  }

  async uploadFile(inputPath: string): Promise<FileRecord> {
    const s = await stat(inputPath);
    const fileName = path.basename(inputPath);
    const hash = await hashFile(inputPath);
    const attachmentsDir = path.join(process.cwd(), '.localdata', 'attachments');
    await mkdir(attachmentsDir, { recursive: true });
    const targetPath = path.join(attachmentsDir, `${hash}-${fileName}`);
    await copyFile(inputPath, targetPath);
    const record: FileRecord = {
      fileId: hash,
      name: fileName,
      size: s.size,
      mimeType: 'application/octet-stream',
      localPath: targetPath,
      createdAt: new Date().toISOString(),
      roomId: this.currentRoom,
    };
    await this.storage.saveFileRecord(record);
    await this.storage.appendEvent(createEvent({
      roomId: this.currentRoom,
      authorPublicKey: this.identity.publicKey,
      authorNickname: this.nickname,
      type: 'file',
      payload: record,
    }));
    return record;
  }

  async listFiles(): Promise<FileRecord[]> { return this.storage.getFileRecords(this.currentRoom); }
}

async function hashFile(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);
  for await (const chunk of stream) hash.update(chunk as Buffer);
  return hash.digest('hex');
}
