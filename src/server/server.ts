import { getViemClient } from '@/app/utils/viem/client';
import { CoinIndexer } from '../shovel/coinIndexer';
import { Watcher } from '../shovel/watcher';

async function main() {
  console.log('[Server] intializing shovel watcher');

  // Create Viem client with correct chain.
  // TODO: use different chain config.
  const viemClient = getViemClient(8453);

  // Create shovel watcher with ERC20 indexer.
  const shovelWatcher = new Watcher();
  await shovelWatcher.init();

  const coinIndexer = new CoinIndexer(viemClient);
  shovelWatcher.add(coinIndexer);
  shovelWatcher.watch();
}

main().catch(console.error);
