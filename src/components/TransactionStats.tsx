import { useEffect, useMemo, useState } from "react";
import { countProgramTxs } from "../utils/countProgramTxs";

type Props = {
  programIds: readonly string[];
  rpcUrl: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "success"; data: { last7d: number; last30d: number } }
  | { status: "error"; message: string };

const numberFormatter = new Intl.NumberFormat("en-US");

export default function TransactionStats({ programIds, rpcUrl }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const uniqueProgramIds = useMemo(
    () => Array.from(new Set(programIds)),
    [programIds]
  );

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      setState((prev) => (prev.status === "success" ? prev : { status: "loading" }));
      try {
        const result = await countProgramTxs(rpcUrl, uniqueProgramIds);
        if (!cancelled) {
          setState({
            status: "success",
            data: {
              last7d: result.last7d.union,
              last30d: result.last30d.union,
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
  }, [rpcUrl, uniqueProgramIds]);

  const renderValues = () => {
    if (state.status === "loading") {
      return <span className="transaction-stats__values--muted">Loading…</span>;
    }

    if (state.status === "error") {
      return <span className="transaction-stats__values--muted">{state.message}</span>;
    }

    return (
      <span>
        Last 7D: <span>{numberFormatter.format(state.data.last7d)}</span>{' | '}Last 30D:{' '}
        <span>{numberFormatter.format(state.data.last30d)}</span>
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
