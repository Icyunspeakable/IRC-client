import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { JsonlStorageDriver } from '../src/storage/jsonlStorage';
import { createIdentity } from '../src/identity/identity';
import { ChatApp } from '../src/core/chatApp';

describe('storage + rooms + files', () => {
  it('persists events and room changes and file metadata', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'frostchat-'));
    const storage = new JsonlStorageDriver(dir);
    const app = new ChatApp(storage, createIdentity('tester'));
    await app.init();
    await app.setRoom('dev');
    await app.sendMessage('hello');
    const history = await app.history();
    expect(history.length).toBe(1);

    const sample = path.join(dir, 'sample.txt');
    await writeFile(sample, 'abc', 'utf8');
    const fileRecord = await app.uploadFile(sample);
    expect(fileRecord.name).toBe('sample.txt');
    const files = await app.listFiles();
    expect(files.length).toBe(1);
  });
});
