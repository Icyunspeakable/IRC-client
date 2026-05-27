import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
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
    await writeFile(this.filesFile(), JSON.stringify(records, null, 2), 'utf8');
  }

  async getFileRecords(roomId?: string): Promise<FileRecord[]> {
    const content = await this.safeRead(this.filesFile(), '[]');
    const parsed = JSON.parse(content) as FileRecord[];
    return roomId ? parsed.filter((record) => record.roomId === roomId) : parsed;
  }

  async saveIdentity(identity: Identity): Promise<void> {
    await writeFile(this.identityFile(), JSON.stringify(identity, null, 2), 'utf8');
  }

  async getIdentity(): Promise<Identity | null> {
    const content = await this.safeRead(this.identityFile(), '');
    return content ? (JSON.parse(content) as Identity) : null;
  }

  async saveState(state: AppState): Promise<void> {
    await writeFile(this.stateFile(), JSON.stringify(state, null, 2), 'utf8');
  }

  async getState(): Promise<AppState | null> {
    const content = await this.safeRead(this.stateFile(), '');
    return content ? (JSON.parse(content) as AppState) : null;
  }

  private async readLines(filePath: string): Promise<string[]> {
    const content = await this.safeRead(filePath, '');
    return content.split('\n').map((line) => line.trim()).filter(Boolean);
  }

  private async safeRead(filePath: string, fallback: string): Promise<string> {
    try { return await readFile(filePath, 'utf8'); } catch { return fallback; }
  }
}
