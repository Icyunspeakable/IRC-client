import { createHash, randomUUID } from 'node:crypto';
import { BaseEvent, EventType } from '../types/events';

export function createEvent(input: {
  roomId: string;
  authorPublicKey: string;
  authorNickname: string;
  type: EventType;
  payload: unknown;
}): BaseEvent {
  const createdAt = new Date().toISOString();
  return {
    id: createHash('sha256').update(`${randomUUID()}${createdAt}`).digest('hex'),
    roomId: input.roomId,
    authorPublicKey: input.authorPublicKey,
    authorNickname: input.authorNickname,
    createdAt,
    type: input.type,
    payload: input.payload,
    signature: null,
  };
}
