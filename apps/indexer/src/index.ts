import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { createPublicClient, http, parseAbiItem } from "viem";
import { PrismaClient } from "@prisma/client";
import { KRADL_CHAINS, getLaunchpadAddress, getLaunchpadStartBlock } from "@kradl/shared";
import {
  processProjectLaunched,
  processTrade,
  processProjectGraduated,
} from "./processor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

const PROJECT_LAUNCHED_EVENT = parseAbiItem(
  "event ProjectLaunched(address indexed token, address indexed creator, string name, string symbol, string metadataUri, uint256 virtualEthReserve, uint256 virtualTokenReserve, uint256 graduationThreshold, uint256 timestamp)"
);

const TRADE_EVENT = parseAbiItem(
  "event Trade(address indexed token, address indexed trader, bool isBuy, uint256 ethAmount, uint256 tokenAmount, uint256 platformFee, uint256 creatorFee, uint256 virtualEthReserve, uint256 virtualTokenReserve, uint256 realEthReserve, uint256 timestamp)"
);

const PROJECT_GRADUATED_EVENT = parseAbiItem(
  "event ProjectGraduated(address indexed token, uint256 ethMigrated, uint256 tokensMigrated, uint256 graduationFee, address liquidityPool, uint256 timestamp)"
);

const MAX_BLOCK_CHUNK = 2_000n;
const POLL_INTERVAL_MS = 3_000;

async function syncChain(chainId: number, launchpadAddress: `0x${string}`, rpcUrl: string) {
  const client = createPublicClient({ transport: http(rpcUrl) });
  const latestBlock = await client.getBlockNumber();

  const startBlock = getLaunchpadStartBlock(chainId);
  const state = await prisma.syncState.upsert({
    where: { chainId },
    update: {},
    create: { chainId, lastSyncedBlock: startBlock > 0n ? startBlock - 1n : 0n },
  });

  let fromBlock =
    state.lastSyncedBlock === 0n ? startBlock : state.lastSyncedBlock + 1n;
  if (fromBlock > latestBlock) return;

  while (fromBlock <= latestBlock) {
    const toBlock =
      fromBlock + MAX_BLOCK_CHUNK > latestBlock ? latestBlock : fromBlock + MAX_BLOCK_CHUNK;

    const [launchLogs, tradeLogs, gradLogs] = await Promise.all([
      client.getLogs({
        address: launchpadAddress,
        event: PROJECT_LAUNCHED_EVENT,
        fromBlock,
        toBlock,
      }),
      client.getLogs({
        address: launchpadAddress,
        event: TRADE_EVENT,
        fromBlock,
        toBlock,
      }),
      client.getLogs({
        address: launchpadAddress,
        event: PROJECT_GRADUATED_EVENT,
        fromBlock,
        toBlock,
      }),
    ]);

    for (const log of launchLogs) {
      if (!log.args.token || !log.args.creator) continue;
      await processProjectLaunched(prisma, chainId, {
        token: log.args.token,
        creator: log.args.creator,
        name: log.args.name ?? "",
        symbol: log.args.symbol ?? "",
        metadataUri: log.args.metadataUri ?? "",
        virtualEthReserve: log.args.virtualEthReserve ?? 0n,
        virtualTokenReserve: log.args.virtualTokenReserve ?? 0n,
        graduationThreshold: log.args.graduationThreshold ?? 0n,
        timestamp: log.args.timestamp ?? BigInt(Math.floor(Date.now() / 1000)),
      });
    }

    for (const log of tradeLogs) {
      if (!log.args.token || !log.args.trader || !log.transactionHash) continue;
      await processTrade(
        prisma,
        chainId,
        log.transactionHash,
        log.logIndex ?? 0,
        log.blockNumber ?? 0n,
        {
          token: log.args.token,
          trader: log.args.trader,
          isBuy: Boolean(log.args.isBuy),
          ethAmount: log.args.ethAmount ?? 0n,
          tokenAmount: log.args.tokenAmount ?? 0n,
          platformFee: log.args.platformFee ?? 0n,
          creatorFee: log.args.creatorFee ?? 0n,
          virtualEthReserve: log.args.virtualEthReserve ?? 0n,
          virtualTokenReserve: log.args.virtualTokenReserve ?? 0n,
          realEthReserve: log.args.realEthReserve ?? 0n,
          timestamp: log.args.timestamp ?? BigInt(Math.floor(Date.now() / 1000)),
        }
      );
    }

    for (const log of gradLogs) {
      if (!log.args.token) continue;
      await processProjectGraduated(prisma, chainId, {
        token: log.args.token,
        liquidityPool: log.args.liquidityPool ?? "0x0000000000000000000000000000000000000000",
      });
    }

    await prisma.syncState.update({
      where: { chainId },
      data: { lastSyncedBlock: toBlock },
    });

    if (launchLogs.length || tradeLogs.length || gradLogs.length) {
      console.log(
        `[chain ${chainId}] Synced blocks ${fromBlock}-${toBlock}: ${launchLogs.length} launches, ${tradeLogs.length} trades, ${gradLogs.length} graduations`
      );
    }

    fromBlock = toBlock + 1n;
  }
}

async function runLoop() {
  console.log("🚀 Kradl Multi-Chain Indexer starting...");

  while (true) {
    for (const chain of Object.values(KRADL_CHAINS)) {
      const address = getLaunchpadAddress(chain.id, process.env);
      if (!address) continue;

      const rpcUrl =
        process.env[`RPC_URL_${chain.id}`] ||
        (chain.id === 46630 ? process.env.ROBINHOOD_TESTNET_RPC_URL : undefined) ||
        (chain.id === 4663 ? process.env.ROBINHOOD_MAINNET_RPC_URL : undefined) ||
        (chain.id === 84532 ? process.env.BASE_SEPOLIA_RPC_URL : undefined) ||
        (chain.id === 8453 ? process.env.BASE_MAINNET_RPC_URL : undefined) ||
        chain.rpcUrl;

      try {
        await syncChain(chain.id, address, rpcUrl);
      } catch (err) {
        console.error(`[chain ${chain.id}] Sync error:`, err instanceof Error ? err.message : err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

runLoop().catch((err) => {
  console.error("Fatal indexer error:", err);
  process.exit(1);
});
