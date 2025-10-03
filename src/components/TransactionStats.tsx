import { useEffect, useMemo, useState } from "react";
import { countProgramTxs } from "../utils/countProgramTxs";

type Props = {
  programIds: readonly string[];
  rpcUrls: readonly string[];
};

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: { last7dTotal: number } }
  | { status: "error"; message: string };

const numberFormatter = new Intl.NumberFormat("en-US");

export default function TransactionStats({ programIds, rpcUrls }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const uniqueProgramIds = useMemo(
    () => Array.from(new Set(programIds)),
    [programIds]
  );

  const uniqueRpcUrls = useMemo(
    () => Array.from(new Set(rpcUrls)),
    [rpcUrls]
  );

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      setState((prev) => (prev.status === "success" ? prev : { status: "loading" }));
      try {
        const result = await countProgramTxs(uniqueRpcUrls, uniqueProgramIds);
        if (!cancelled) {
          setState({
            status: "success",
            data: {
              last7dTotal: result.last7d.total,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch transaction stats", error);
        if (!cancelled) {
          setState({ status: "error", message: "Unable to load stats" });
        }
      } finally {
        if (!cancelled) {
          timeout = setTimeout(load, 5 * 60 * 1000);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [uniqueProgramIds, uniqueRpcUrls]);

  const renderValues = () => {
    if (state.status === "loading") {
      return <span className="transaction-stats__values--muted">Loading…</span>;
    }

    if (state.status === "error") {
      return <span className="transaction-stats__values--muted">{state.message}</span>;
    }

    return (
      <span>
        Last 7D: <span>{numberFormatter.format(state.data.last7dTotal)}</span>
      </span>
    );
  };

  return (
    <div className="transaction-stats" role="status" aria-live="polite">
      <span className="transaction-stats__title">Transactions processed</span>
      <span className="transaction-stats__values">{renderValues()}</span>
    </div>
  );
}
