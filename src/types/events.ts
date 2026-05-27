export type EventType = 'message' | 'file' | 'edit' | 'delete' | 'system';

export interface BaseEvent {
  id: string;
  roomId: string;
  authorPublicKey: string;
  authorNickname: string;
  createdAt: string;
  type: EventType;
  payload: unknown;
  signature: string | null;
}

export interface FilePayload {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  localPath: string;
  chunkHashes: string[];
}
