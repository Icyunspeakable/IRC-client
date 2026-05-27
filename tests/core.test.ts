import { describe, it, expect } from 'vitest';
import { createEvent } from '../src/events';

describe('createEvent', () => {
  it('builds a message event with an id and room', () => {
    const event = createEvent({
      roomId: 'lobby',
      authorPublicKey: 'pub',
      authorNickname: 'nick',
      type: 'message',
      payload: { text: 'hi' },
    });

    expect(event.id.length).toBeGreaterThan(10);
    expect(event.roomId).toBe('lobby');
    expect(event.type).toBe('message');
  });
});
