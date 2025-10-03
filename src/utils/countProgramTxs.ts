import { Commitment, Connection, PublicKey } from "@solana/web3.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withBackoff<T>(fn: () => Promise<T>, label: string, maxRetries = 5): Promise<T> {
  let attempt = 0;
  let delay = 250;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > maxRetries) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`[${label}] failed after ${maxRetries} retries: ${message}`);
      }
      await sleep(delay + Math.floor(Math.random() * 100));
      delay *= 2;
    }
  }
}

type SlotTimeResolver = (slot: number) => Promise<number | null>;

function makeSlotTimeResolver(connection: Connection): SlotTimeResolver {
  const cache = new Map<number, number | null>();
  return async (slot: number): Promise<number | null> => {
    if (cache.has(slot)) {
      return cache.get(slot) ?? null;
    }

    const result = await withBackoff(
      async () => connection.getBlockTime(slot),
      `getBlockTime(slot=${slot})`
    );

    cache.set(slot, result);
    return result;
  };
}

async function fetchSignaturesSince(
  connection: Connection,
  address: PublicKey,
  sinceEpochSec: number,
  commitment: Commitment,
  resolveSlotTime: SlotTimeResolver
): Promise<Set<string>> {
  const signatures = new Set<string>();

  let before: string | undefined;
  const limit = 1000;

  while (true) {
    const page = await withBackoff(
      () => connection.getSignaturesForAddress(address, { before, limit }, commitment),
      `getSignaturesForAddress(${address.toBase58()})`
    );

    if (page.length === 0) {
      break;
    }

    let reachedBelowWindow = false;

    for (const info of page) {
      let timestamp = info.blockTime ?? null;

      if (timestamp === null) {
        timestamp = await resolveSlotTime(info.slot);
      }

      if (timestamp !== null) {
        if (timestamp >= sinceEpochSec) {
          signatures.add(info.signature);
        } else {
          reachedBelowWindow = true;
        }
      } else {
        signatures.add(info.signature);
      }
    }

    before = page[page.length - 1]?.signature;

    if (reachedBelowWindow) {
      break;
    }
  }

  return signatures;
}

type RpcProgramSummary = {
  perProgram: Record<string, number>;
  total: number;
};

export async function countProgramTxs(
  rpcUrls: readonly string[],
  programIds: readonly string[],
  opts?: { commitment?: Commitment }
): Promise<{
  last7d: { perRpc: Record<string, RpcProgramSummary>; total: number };
}> {
  const commitment = opts?.commitment ?? "confirmed";
  const nowSec = Math.floor(Date.now() / 1000);
  const since7d = nowSec - 7 * 24 * 60 * 60;

  const uniqueRpcUrls = Array.from(new Set(rpcUrls));
  const uniqueProgramIds = Array.from(new Set(programIds));

  const rpcSummaries = await Promise.all(
    uniqueRpcUrls.map(async (rpcUrl) => {
      const connection = new Connection(rpcUrl, commitment);
      const resolveSlotTime = makeSlotTimeResolver(connection);

      const programSummaries = await Promise.all(
        uniqueProgramIds.map(async (programId) => {
          const publicKey = new PublicKey(programId);
          const signatures = await fetchSignaturesSince(
            connection,
            publicKey,
            since7d,
            commitment,
            resolveSlotTime
          );

          return { programId, count: signatures.size };
        })
      );

      const perProgram: Record<string, number> = {};
      let total = 0;
      for (const { programId, count } of programSummaries) {
        perProgram[programId] = count;
        total += count;
      }

      return { rpcUrl, summary: { perProgram, total } };
    })
  );

  const perRpc: Record<string, RpcProgramSummary> = {};
  let total = 0;
  for (const { rpcUrl, summary } of rpcSummaries) {
    perRpc[rpcUrl] = summary;
    total += summary.total;
  }

  return { last7d: { perRpc, total } };
}
