import { createHash, randomUUID } from 'node:crypto';

export type EventType = 'message' | 'file';

export interface ChatEvent {
  id: string;
  roomId: string;
  authorPublicKey: string;
  authorNickname: string;
  createdAt: string;
  type: EventType;
  payload: unknown;
}

export function createEvent(input: {
  roomId: string;
  authorPublicKey: string;
  authorNickname: string;
  type: EventType;
  payload: unknown;
}): ChatEvent {
  const createdAt = new Date().toISOString();
  return {
    id: createHash('sha256').update(`${randomUUID()}${createdAt}`).digest('hex'),
    roomId: input.roomId,
    authorPublicKey: input.authorPublicKey,
    authorNickname: input.authorNickname,
    createdAt,
    type: input.type,
    payload: input.payload,
  };
}
