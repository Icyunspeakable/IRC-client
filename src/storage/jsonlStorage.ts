import { mkdir, readFile, writeFile, appendFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { BaseEvent } from '../types/events';
import { StorageDriver, FileRecord, AppState } from './storage';
import { Identity } from '../identity/identity';

export class JsonlStorageDriver implements StorageDriver {
  constructor(private readonly rootDir: string) {}
  private eventsFile() { return path.join(this.rootDir, 'events.jsonl'); }
  private filesFile() { return path.join(this.rootDir, 'files.json'); }
  private identityFile() { return path.join(this.rootDir, 'identity.json'); }
  private stateFile() { return path.join(this.rootDir, 'state.json'); }

  async ensure(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    await mkdir(path.join(this.rootDir, 'attachments'), { recursive: true });
  }

  async appendEvent(event: BaseEvent): Promise<void> {
    await appendFile(this.eventsFile(), `${JSON.stringify(event)}\n`, 'utf8');
  }

  async getEventsByRoom(roomId: string): Promise<BaseEvent[]> {
    const lines = await this.readLines(this.eventsFile());
    return lines.map((line) => JSON.parse(line) as BaseEvent).filter((event) => event.roomId === roomId);
  }

  async saveFileRecord(record: FileRecord): Promise<void> {
    const records = await this.getFileRecords();
    records.push(record);
    await this.writeJsonAtomic(this.filesFile(), records);
  }

  async getFileRecords(roomId?: string): Promise<FileRecord[]> {
    const parsed = await this.safeReadJson<FileRecord[]>(this.filesFile(), []);
    return roomId ? parsed.filter((record) => record.roomId === roomId) : parsed;
  }

  async saveIdentity(identity: Identity): Promise<void> {
    await this.writeJsonAtomic(this.identityFile(), identity);
  }

  async getIdentity(): Promise<Identity | null> {
    return this.safeReadJson<Identity | null>(this.identityFile(), null);
  }

  async saveState(state: AppState): Promise<void> {
    await this.writeJsonAtomic(this.stateFile(), state);
  }

  async getState(): Promise<AppState | null> {
    return this.safeReadJson<AppState | null>(this.stateFile(), null);
  }

  private async readLines(filePath: string): Promise<string[]> {
    const content = await this.safeRead(filePath, '');
    return content.split('\n').map((line) => line.trim()).filter(Boolean);
  }

  private async safeRead(filePath: string, fallback: string): Promise<string> {
    try { return await readFile(filePath, 'utf8'); } catch { return fallback; }
  }

  private async safeReadJson<T>(filePath: string, fallback: T): Promise<T> {
    const raw = await this.safeRead(filePath, '');
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }

  private async writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
    const tmpFile = `${filePath}.tmp`;
    await writeFile(tmpFile, JSON.stringify(value, null, 2), 'utf8');
    await rename(tmpFile, filePath);
  }
}
