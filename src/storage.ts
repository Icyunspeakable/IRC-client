import { mkdir, readFile, writeFile, appendFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { ChatEvent } from './events';
import { Identity } from './identity';

export interface FileRecord {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  localPath: string;
  createdAt: string;
  roomId: string;
}

export interface AppState {
  currentRoom: string;
  nickname: string;
}

export interface Storage {
  ensure(): Promise<void>;
  appendEvent(event: ChatEvent): Promise<void>;
  getEventsByRoom(roomId: string): Promise<ChatEvent[]>;
  saveFileRecord(record: FileRecord): Promise<void>;
  getFileRecords(roomId?: string): Promise<FileRecord[]>;
  saveIdentity(identity: Identity): Promise<void>;
  getIdentity(): Promise<Identity | null>;
  saveState(state: AppState): Promise<void>;
  getState(): Promise<AppState | null>;
}

const MIME_BY_EXT: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

export class JsonlStorage implements Storage {
  constructor(private readonly rootDir: string) {}

  async ensure(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await mkdir(path.join(this.rootDir, 'attachments'), { recursive: true });
  }

  async appendEvent(event: ChatEvent): Promise<void> {
    const file = path.join(this.rootDir, 'events.jsonl');
    await appendFile(file, `${JSON.stringify(event)}\n`, 'utf8');
  }

  async getEventsByRoom(roomId: string): Promise<ChatEvent[]> {
    const file = path.join(this.rootDir, 'events.jsonl');
    const lines = await readTextLines(file);
    return lines
      .map((line) => JSON.parse(line) as ChatEvent)
      .filter((event) => event.roomId === roomId);
  }

  async saveFileRecord(record: FileRecord): Promise<void> {
    const records = await this.getFileRecords();
    records.push(record);
    await writeJson(path.join(this.rootDir, 'files.json'), records);
  }

  async getFileRecords(roomId?: string): Promise<FileRecord[]> {
    const records = await readJson<FileRecord[]>(path.join(this.rootDir, 'files.json'), []);
    return roomId ? records.filter((r) => r.roomId === roomId) : records;
  }

  async saveIdentity(identity: Identity): Promise<void> {
    await writeJson(path.join(this.rootDir, 'identity.json'), identity);
  }

  async getIdentity(): Promise<Identity | null> {
    return readJson<Identity | null>(path.join(this.rootDir, 'identity.json'), null);
  }

  async saveState(state: AppState): Promise<void> {
    await writeJson(path.join(this.rootDir, 'state.json'), state);
  }

  async getState(): Promise<AppState | null> {
    return readJson<AppState | null>(path.join(this.rootDir, 'state.json'), null);
  }
}

async function readTextLines(filePath: string): Promise<string[]> {
  const content = await readText(filePath);
  return content.split('\n').map((line) => line.trim()).filter(Boolean);
}

async function readText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  const raw = await readText(filePath);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await rename(tmp, filePath);
}
