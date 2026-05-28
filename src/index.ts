import path from 'node:path';
import { appendFile, mkdir } from 'node:fs/promises';
import { startCli } from './cli';
import { startTui } from './tui';
import { ChatApp } from './app';
import { createIdentity } from './identity';
import { JsonlStorage } from './storage';
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr } from '@multiformats/multiaddr'
import { ping } from '@libp2p/ping'


async function main(): Promise<void> {
  const node = await createLibp2p({
    addresses: {
      // add a listen address (localhost) to accept TCP connections on a random port
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
    transports: [tcp()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      ping: ping({
        protocolPrefix: 'ipfs', // default
      }),
    },
  })

  // start libp2p
  await node.start()
  console.log('libp2p has started')

  const logPath = path.join(process.cwd(), '.localdata', 'libp2p.log');
  await mkdir(path.dirname(logPath), { recursive: true });
  await appendFile(logPath, 'libp2p has started\n', 'utf8');

  // print out listening addresses
  const addresses = ['listening on addresses:', ...node.getMultiaddrs().map((addr) => addr.toString())].join('\n') + '\n';
  await appendFile(logPath, addresses, 'utf8');

  // ping peer if received multiaddr
  if (process.argv.length >= 3) {
    const ma = multiaddr(process.argv[2])
    console.log(`pinging remote peer at ${process.argv[2]}`)
    await appendFile(logPath, `pinging remote peer at ${process.argv[2]}\n`, 'utf8');
    const latency = await node.services.ping.ping(ma)
    console.log(`pinged ${process.argv[2]} in ${latency}ms`)
    await appendFile(logPath, `pinged ${process.argv[2]} in ${latency}ms\n`, 'utf8');
  } else {
    console.log('no remote peer address given, skipping ping')
    await appendFile(logPath, 'no remote peer address given, skipping ping\n', 'utf8');
  }


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

  const stop = async () => {
    // stop libp2p
    await node.stop()
    console.log('libp2p has stopped')
    await appendFile(logPath, 'libp2p has stopped\n', 'utf8');
    process.exit(0)
  }

  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
}

void main();
