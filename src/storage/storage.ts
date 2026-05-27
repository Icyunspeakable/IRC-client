import { BaseEvent } from '../types/events';
import { Identity } from '../identity/identity';

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

export interface StorageDriver {
  ensure(): Promise<void>;
  appendEvent(event: BaseEvent): Promise<void>;
  getEventsByRoom(roomId: string): Promise<BaseEvent[]>;
  saveFileRecord(record: FileRecord): Promise<void>;
  getFileRecords(roomId?: string): Promise<FileRecord[]>;
  saveIdentity(identity: Identity): Promise<void>;
  getIdentity(): Promise<Identity | null>;
  saveState(state: AppState): Promise<void>;
  getState(): Promise<AppState | null>;
}
