import path from 'node:path';
import { startCli } from './client/cli';
import { ChatApp } from './core/chatApp';
import { createIdentity } from './identity/identity';
import { JsonlStorageDriver } from './storage/jsonlStorage';

async function main(): Promise<void> {
  const dataDir = path.join(process.cwd(), '.localdata');
  const storage = new JsonlStorageDriver(dataDir);
  let identity = await storage.getIdentity();
  if (!identity) {
    identity = createIdentity();
    await storage.saveIdentity(identity);
  }
  const app = new ChatApp(storage, identity);
  await app.init();
  startCli(app);
}

void main();
