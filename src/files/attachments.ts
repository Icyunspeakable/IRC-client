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
