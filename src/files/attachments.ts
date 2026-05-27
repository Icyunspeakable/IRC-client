import path from 'node:path';

export interface ChunkInfo {
  hash: string;
  offset: number;
  size: number;
}

export interface FileAttachmentMeta {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  localPath: string;
  chunkHashes: string[];
}

const mimeByExt: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export function detectMimeType(fileName: string): string {
  return mimeByExt[path.extname(fileName).toLowerCase()] ?? 'application/octet-stream';
}
