import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ChatApp } from '../src/app';
import { createIdentity } from '../src/identity';
import { JsonlStorage } from '../src/storage';

describe('ChatApp', () => {
  it('shows lobby intro with the current nickname', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frostchat-'));
    const storage = new JsonlStorage(dir);
    const app = new ChatApp(storage, createIdentity('frost'));

    await app.init();
    await app.setRoom('dev');
    expect(app.getRoomIntro()).toEqual([]);

    await app.setRoom('lobby');
    expect(app.getRoomIntro()[0]).toBe('you are currently logged in as: frost');
  });

  it('keeps messages and uploads scoped to the active room', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frostchat-'));
    const storage = new JsonlStorage(dir);
    const app = new ChatApp(storage, createIdentity('tester'));

    await app.init();
    await app.setRoom('dev');
    const line = await app.sendMessage('hello');

    expect(line).toContain('hello');
    expect(await app.getHistory()).toHaveLength(1);

    const sample = path.join(dir, 'sample.txt');
    await writeFile(sample, 'abc', 'utf8');

    const uploaded = await app.uploadFile(sample);
    expect(uploaded.name).toBe('sample.txt');
    expect(uploaded.mimeType).toBe('text/plain');
    expect(await app.listFiles()).toHaveLength(1);
  });
});
