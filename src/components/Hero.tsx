import TransactionStats from "./TransactionStats";
import { PROGRAM_IDS } from "../constants";

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL ?? DEFAULT_RPC;

export default function Hero() {
  return (
    <section className="supersize">
      <div className="supersize-inner">
        <h1 className="supersize-title">SUPERSIZE</h1>
        <h2 className="supersize-subtitle">Casual games with real liquidity</h2>
        <TransactionStats programIds={PROGRAM_IDS} rpcUrl={rpcUrl} />
      </div>
    </section>
  );
}
