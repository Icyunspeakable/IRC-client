import path from 'node:path';
import { startCli } from './cli';
import { startTui } from './tui';
import { ChatApp } from './app';
import { createIdentity } from './identity';
import { JsonlStorage } from './storage';

async function main(): Promise<void> {
  const dataDir = path.join(process.cwd(), '.localdata');
  const storage = new JsonlStorage(dataDir);
  await storage.ensure();

  let identity = await storage.getIdentity();
  if (!identity) {
    identity = createIdentity();
    await storage.saveIdentity(identity);
  }

  const app = new ChatApp(storage, identity);
  await app.init();

  if (process.argv.includes('--cli')) {
    startCli(app);
  } else {
    await startTui(app);
  }
}

void main();
