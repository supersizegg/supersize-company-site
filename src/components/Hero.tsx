import TransactionStats from "./TransactionStats";
import { DEFAULT_RPC_ENDPOINTS, PROGRAM_IDS } from "../constants";

const envRpcUrls = import.meta.env.VITE_SOLANA_RPC_URLS as string | undefined;
const rpcUrls =
  envRpcUrls && envRpcUrls.trim().length > 0
    ? envRpcUrls
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
    : Array.from(DEFAULT_RPC_ENDPOINTS);

export default function Hero() {
  return (
    <section className="supersize">
      <div className="supersize-inner">
        <h1 className="supersize-title">SUPERSIZE</h1>
        <h2 className="supersize-subtitle">Casual games with real liquidity</h2>
        <TransactionStats programIds={PROGRAM_IDS} rpcUrls={rpcUrls} />
      </div>
    </section>
  );
}
