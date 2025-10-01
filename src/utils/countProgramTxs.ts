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

export async function countProgramTxs(
  rpcUrl: string,
  programIds: readonly string[],
  opts?: { commitment?: Commitment }
): Promise<{
  last7d: { perProgram: Record<string, number>; union: number };
  last30d: { perProgram: Record<string, number>; union: number };
}> {
  const connection = new Connection(rpcUrl, opts?.commitment ?? "confirmed");

  const nowSec = Math.floor(Date.now() / 1000);
  const since7d = nowSec - 7 * 24 * 60 * 60;
  const since30d = nowSec - 30 * 24 * 60 * 60;

  const perProgram7: Record<string, number> = {};
  const perProgram30: Record<string, number> = {};
  const union7 = new Set<string>();
  const union30 = new Set<string>();

  const resolveSlotTime = makeSlotTimeResolver(connection);

  for (const programId of programIds) {
    const publicKey = new PublicKey(programId);

    const signatures30 = await fetchSignaturesSince(
      connection,
      publicKey,
      since30d,
      opts?.commitment ?? "confirmed",
      resolveSlotTime
    );
    perProgram30[programId] = signatures30.size;
    signatures30.forEach((signature) => union30.add(signature));

    const signatures7 = await fetchSignaturesSince(
      connection,
      publicKey,
      since7d,
      opts?.commitment ?? "confirmed",
      resolveSlotTime
    );
    perProgram7[programId] = signatures7.size;
    signatures7.forEach((signature) => union7.add(signature));
  }

  return {
    last7d: { perProgram: perProgram7, union: union7.size },
    last30d: { perProgram: perProgram30, union: union30.size },
  };
}
