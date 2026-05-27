import { describe, it, expect } from 'vitest';
import { parseCommand } from '../src/core/commands';

describe('command parser', () => {
  it('parses slash commands and args', () => {
    expect(parseCommand('/nick frost')?.name).toBe('nick');
    expect(parseCommand('/msg hello world')?.args).toBe('hello world');
  });

  it('rejects unknown and non-command input', () => {
    expect(parseCommand('hi')).toBeNull();
    expect(parseCommand('/wat')).toBeNull();
  });
});
