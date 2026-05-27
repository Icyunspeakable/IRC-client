import { describe, it, expect } from 'vitest';
import { parseCommand } from '../src/commands';

describe('parseCommand', () => {
  it('reads command name and trailing args', () => {
    expect(parseCommand('/nick frost')?.name).toBe('nick');
    expect(parseCommand('/msg hello world')?.args).toBe('hello world');
  });

  it('ignores plain text and unknown commands', () => {
    expect(parseCommand('hello')).toBeNull();
    expect(parseCommand('/nope')).toBeNull();
  });
});
