import { useEffect, useRef, useState } from "react";
import type { Wallet, WalletKind } from "../types";
import { formatSol, formatUsd, SOL_USD, shortAddr } from "../format";

const OPTIONS: WalletKind[] = ["Phantom", "Solflare", "Backpack"];

export function ConnectModal({
  open,
  onClose,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  onConnected: (kind: WalletKind) => void;
}) {
  const [linking, setLinking] = useState<WalletKind | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!open) setLinking(null);
  }, [open]);

  if (!open) return null;

  function pick(kind: WalletKind) {
    setLinking(kind);
    window.setTimeout(() => {
      if (openRef.current) onConnected(kind);
    }, 720);
  }

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="connect-title">
        <p className="kicker">Wallet</p>
        <h2 id="connect-title">Connect to CortexDePIN</h2>
        <p className="muted">Simulated connection. No browser extension and no signature leaves this demo.</p>
        <div className="wallets">
          {OPTIONS.map((kind) => (
            <button key={kind} type="button" onClick={() => pick(kind)} disabled={linking !== null}>
              <span>
                <strong>{kind}</strong>
                <small className="muted" style={{ display: "block" }}>
                  {linking === kind ? "Requesting session…" : "Devnet · simulated"}
                </small>
              </span>
              <span className="mark-letter">{kind.slice(0, 1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WalletControl({
  wallet,
  open,
  onToggle,
  onClose,
  onConnect,
  onCopy,
  onAttest,
  onReset,
  onDisconnect,
}: {
  wallet: Wallet | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onConnect: () => void;
  onCopy: () => void;
  onAttest: () => void;
  onReset: () => void;
  onDisconnect: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".wallet-wrap")) onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  if (!wallet) {
    return (
      <button className="btn primary" type="button" onClick={onConnect}>
        Connect wallet
      </button>
    );
  }

  return (
    <div className="wallet-wrap">
      <button className="wallet-btn" type="button" onClick={onToggle}>
        <strong>{shortAddr(wallet.address)}</strong>
        <span>
          {wallet.kind} · {formatSol(wallet.sol)}
        </span>
      </button>
      {open && (
        <div className="menu">
          <p>{wallet.kind} · Solana devnet · simulated</p>
          <div className="menu-addr">{wallet.address}</div>
          <strong>{formatUsd(wallet.sol * SOL_USD)}</strong>
          <button className="btn ghost" type="button" onClick={onCopy}>Copy address</button>
          <button className="btn ghost" type="button" onClick={onAttest}>Attestations</button>
          <button className="btn ghost" type="button" onClick={onReset}>Reset demo</button>
          <button className="btn ghost" type="button" onClick={onDisconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
