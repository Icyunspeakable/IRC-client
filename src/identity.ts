import { randomBytes } from 'node:crypto';

export interface Identity {
  peerId: string;
  publicKey: string;
  privateKey: string;
  nickname: string;
}

export function createIdentity(nickname = 'anon'): Identity {
  return {
    peerId: randomBytes(16).toString('hex'),
    publicKey: randomBytes(32).toString('hex'),
    privateKey: randomBytes(64).toString('hex'),
    nickname,
  };
}
