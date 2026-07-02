(() => {
  const RPC_ENDPOINTS = [
    {
      label: "BOS",
      url: "https://supersize-mainnet-bos.magicblock.app",
    },
    {
      label: "MAIN",
      url: "https://supersize-mainnet.magicblock.app",
    },
    {
      label: "SIN",
      url: "https://supersize-mainnet-sin.magicblock.app",
    },
  ];

  const PROGRAMS = [
    {
      label: "game",
      className: "game",
      address: "CyurcRVPuNLbCTBFeqRd3hz2iAA6uqYaBfnDDGeEWCHx",
    },
    {
      label: "vault",
      className: "vault",
      address: "DZtWbzgheM9YEaQu24dR3bkvWHURhSZw5jFwZyoz95DH",
    },
    {
      label: "matchmaking",
      className: "matchmaking",
      address: "CbXon1e9YuLVNB9pwkg1TYN7s5c8beoLX8RgGFXavZSn",
    },
  ];

  const listEl = document.getElementById("transaction-feed-list");
  const statusEl = document.getElementById("transaction-feed-status");

  if (!listEl || !statusEl) {
    return;
  }

  const REFRESH_INTERVAL_MS = 1000;
  const REQUEST_TIMEOUT_MS = 1500;
  const SIGNATURE_LIMIT = 10;
  const PROGRAM_PRIORITY = {
    game: 3,
    matchmaking: 2,
    vault: 1,
  };

  let isRefreshing = false;
  let latestTransactions = [];

  const truncateSignature = (signature) => {
    if (!signature || signature.length <= 18) {
      return signature;
    }

    return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
  };

  const formatAge = (blockTime) => {
    if (!blockTime) {
      return "recent";
    }

    const secondsAgo = Math.max(0, Math.floor(Date.now() / 1000 - blockTime));

    if (secondsAgo < 60) {
      return `${secondsAgo}s`;
    }

    const minutesAgo = Math.floor(secondsAgo / 60);

    if (minutesAgo < 60) {
      return `${minutesAgo}m`;
    }

    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h`;
  };

  const explorerUrl = (signature, endpointUrl) => {
    const customUrl = encodeURIComponent(endpointUrl);
    return `https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${customUrl}`;
  };

  const setStatus = (text, state = "live") => {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-stale", state === "stale");
    statusEl.classList.toggle("is-error", state === "error");
  };

  const renderTransactions = (transactions) => {
    if (!transactions.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "transaction-feed-empty";
      emptyItem.textContent = "Waiting for recent on-chain activity...";
      listEl.replaceChildren(emptyItem);
      return;
    }

    const fragment = document.createDocumentFragment();

    transactions.forEach((transaction) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const program = document.createElement("span");
      const copy = document.createElement("span");
      const signature = document.createElement("span");
      const meta = document.createElement("span");

      item.className = "transaction-feed-item";

      link.className = "transaction-feed-link";
      link.href = explorerUrl(transaction.signature, transaction.endpointUrl);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = `Inspect ${transaction.signature}`;

      program.className = `transaction-program transaction-program--${transaction.programClass}`;
      program.textContent = transaction.programLabel;

      copy.className = "transaction-copy";
      signature.className = "transaction-signature";
      signature.textContent = truncateSignature(transaction.signature);

      meta.className = "transaction-meta";
      meta.textContent = `${transaction.endpointLabel} - ${formatAge(transaction.blockTime)}`;

      copy.append(signature, meta);
      link.append(program, copy);
      item.append(link);
      fragment.append(item);
    });

    listEl.replaceChildren(fragment);
  };

  const rpc = async (endpoint, method, params) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `tx-feed-${endpoint.label}-${Date.now()}`,
          method,
          params,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`${endpoint.label} returned HTTP ${response.status}`);
      }

      const payload = await response.json();

      if (payload.error) {
        throw new Error(payload.error.message || `${endpoint.label} RPC error`);
      }

      return payload.result;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const fetchProgramTransactions = async (endpoint, program) => {
    const signatures = await rpc(endpoint, "getSignaturesForAddress", [
      program.address,
      {
        commitment: "confirmed",
        limit: SIGNATURE_LIMIT,
      },
    ]);

    if (!Array.isArray(signatures)) {
      return [];
    }

    return signatures
      .filter((signatureInfo) => signatureInfo && signatureInfo.signature)
      .map((signatureInfo) => ({
        blockTime: signatureInfo.blockTime || 0,
        endpointLabel: endpoint.label,
        endpointUrl: endpoint.url,
        programClass: program.className,
        programLabel: program.label,
        signature: signatureInfo.signature,
        slot: signatureInfo.slot || 0,
      }));
  };

  const newestFirst = (a, b) => {
    const blockTimeDelta = (b.blockTime || 0) - (a.blockTime || 0);

    if (blockTimeDelta !== 0) {
      return blockTimeDelta;
    }

    return (b.slot || 0) - (a.slot || 0);
  };

  const mergeTransactions = (transactionGroups) => {
    const bySignature = new Map();

    transactionGroups.flat().forEach((transaction) => {
      const existing = bySignature.get(transaction.signature);
      const isNewer = existing && newestFirst(transaction, existing) < 0;
      const isMoreSpecific =
        existing &&
        newestFirst(transaction, existing) === 0 &&
        (PROGRAM_PRIORITY[transaction.programLabel] || 0) >
          (PROGRAM_PRIORITY[existing.programLabel] || 0);

      if (!existing || isNewer || isMoreSpecific) {
        bySignature.set(transaction.signature, transaction);
      }
    });

    return Array.from(bySignature.values()).sort(newestFirst).slice(0, SIGNATURE_LIMIT);
  };

  const refreshTransactions = async () => {
    if (isRefreshing) {
      return;
    }

    isRefreshing = true;

    try {
      const requests = RPC_ENDPOINTS.flatMap((endpoint) =>
        PROGRAMS.map((program) => fetchProgramTransactions(endpoint, program))
      );

      const results = await Promise.allSettled(requests);
      const fulfilled = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      if (!fulfilled.length) {
        if (!latestTransactions.length) {
          renderTransactions([]);
        }

        setStatus("Offline", "error");
        return;
      }

      latestTransactions = mergeTransactions(fulfilled);
      renderTransactions(latestTransactions);

      const failedCount = results.length - fulfilled.length;
      setStatus(failedCount ? "Partial" : "Live", failedCount ? "stale" : "live");
    } catch (error) {
      setStatus("Offline", "error");
    } finally {
      isRefreshing = false;
    }
  };

  refreshTransactions();
  window.setInterval(refreshTransactions, REFRESH_INTERVAL_MS);
})();
