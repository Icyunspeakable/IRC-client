import { describe, it, expect } from 'vitest';
import { createEvent } from '../src/core/eventFactory';

describe('eventFactory', () => {
  it('creates append-only signed placeholder events', () => {
    const evt = createEvent({ roomId: 'lobby', authorPublicKey: 'pub', authorNickname: 'nick', type: 'message', payload: { text: 'hi' } });
    expect(evt.id.length).toBeGreaterThan(10);
    expect(evt.signature).toBeNull();
    expect(evt.roomId).toBe('lobby');
  });
});
