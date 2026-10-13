import { useCallback, useEffect, useRef, useState } from "react";
import { Attest } from "./components/Attest";
import { Deploy } from "./components/Deploy";
import { Jobs } from "./components/Jobs";
import { Market } from "./components/Market";
import { Supply } from "./components/Supply";
import { ConnectModal, WalletControl } from "./components/WalletUI";
import { advanceJob, createJob, GPU_CATALOG, seedNodes, WALLETS } from "./data";
import { cx, formatUsd, roundSol, roundUsd, SOL_USD } from "./format";
import type { GpuNode, Job, View, Wallet, WalletKind, Workload } from "./types";

const FEE_SOL = 0.000005;

function Mark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="3" width="16" height="16" rx="4" fill="#9945FF" />
      <rect x="13" y="13" width="16" height="16" rx="4" fill="#14F195" />
    </svg>
  );
}

export function App() {
  const [view, setView] = useState<View>("market");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nodes, setNodes] = useState<GpuNode[]>(() => seedNodes());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [attestId, setAttestId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sawAttest, setSawAttest] = useState(false);
  const pending = useRef<string | null>(null);
  const jobsRef = useRef<Job[]>([]);
  const settledIds = useRef(new Set<string>());

  const commitJobs = useCallback((next: Job[]) => {
    jobsRef.current = next;
    setJobs(next);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const prev = jobsRef.current;
      if (!prev.some((job) => job.status === "running")) return;
      const finished: Job[] = [];
      const next = prev.map((job) => {
        const updated = advanceJob(job);
        if (job.status === "running" && updated.status === "verified" && !settledIds.current.has(job.id)) {
          settledIds.current.add(job.id);
          finished.push(updated);
        }
        return updated;
      });
      commitJobs(next);
      if (!finished.length) return;
      const refundUsd = finished.reduce((sum, job) => sum + (job.escrowUsd - job.quoteUsd), 0);
      setWallet((current) =>
        current ? { ...current, sol: roundSol(current.sol + refundUsd / SOL_USD) } : current
      );
      setNodes((current) =>
        current.map((node) => {
          const done = finished.filter((job) => job.nodeId === node.id);
          if (!done.length) return node;
          const earned = node.owner === "you" ? done.reduce((sum, job) => sum + job.quoteUsd, 0) : 0;
          return { ...node, jobs: node.jobs + done.length, earnedUsd: roundUsd(node.earnedUsd + earned) };
        })
      );
      setToast(`Job verified. ${formatUsd(refundUsd)} buffer refunded to your wallet.`);
    }, 100);
    return () => window.clearInterval(timer);
  }, [commitJobs]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWalletOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (view === "attest" && jobs.some((job) => job.status === "verified")) setSawAttest(true);
  }, [view, jobs]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;
  const running = jobs.find((job) => job.status === "running") ?? null;
  const verifiedCount = jobs.filter((job) => job.status === "verified").length;

  function connect(kind: WalletKind) {
    const preset = WALLETS[kind];
    setWallet({ kind, address: preset.address, sol: preset.sol });
    setWalletOpen(false);
    setToast(`${kind} connected on simulated devnet.`);
    if (pending.current) {
      const id = pending.current;
      pending.current = null;
      setSelectedId(id);
      setView("deploy");
    }
  }

  function deploy(id: string) {
    const node = nodes.find((item) => item.id === id);
    if (!node || node.status === "busy") return;
    if (!wallet) {
      pending.current = id;
      setWalletOpen(true);
      setToast("Connect a wallet to lock escrow.");
      return;
    }
    setSelectedId(id);
    setView("deploy");
  }

  function startJob(draft: { workload: Workload; model: string; input: string; quoteUsd: number; escrowUsd: number }) {
    if (!wallet || !selected) return;
    const escrowSol = roundSol(draft.escrowUsd / SOL_USD);
    const job = createJob({ node: selected, ...draft });
    setWallet({ ...wallet, sol: roundSol(wallet.sol - escrowSol - FEE_SOL) });
    commitJobs([job, ...jobsRef.current]);
    setFocusId(job.id);
    setAttestId(job.id);
    setView("jobs");
    setToast("Escrow locked. Micropayments will follow each attested slice.");
  }

  function listNode(input: { name: string; city: string; region: string; gpu: string; usdPerHour: number }) {
    const spec = GPU_CATALOG.find((item) => item.gpu === input.gpu) ?? GPU_CATALOG[0];
    const node: GpuNode = {
      id: `you-${Date.now()}`,
      name: input.name.trim(),
      region: input.region,
      city: input.city.trim(),
      gpu: spec.gpu,
      vram: spec.vram,
      usdPerHour: input.usdPerHour,
      uptime: 100,
      attested: 100,
      jobs: 0,
      workloads: [...spec.workloads],
      status: "open",
      owner: "you",
      earnedUsd: 0,
    };
    setNodes((current) => [node, ...current]);
    setToast(`${node.name} is live on the marketplace.`);
  }

  function resetDemo() {
    settledIds.current = new Set();
    commitJobs([]);
    setNodes(seedNodes());
    setFocusId(null);
    setAttestId(null);
    setSelectedId(null);
    setSawAttest(false);
    setView("market");
    setMenuOpen(false);
    setWallet((current) => (current ? { ...current, sol: WALLETS[current.kind].sol } : current));
    setToast("Demo reset.");
  }

  async function copyAddress() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setToast("Address copied.");
    } catch {
      setToast("Could not copy the address.");
    }
    setMenuOpen(false);
  }

  const stepConnect = wallet ? "done" : "active";
  const stepDeploy = jobs.length > 0 ? "done" : wallet ? "active" : "wait";
  const stepStream = verifiedCount > 0 ? "done" : running ? "active" : "wait";
  const stepProof = sawAttest ? "done" : verifiedCount > 0 ? "active" : "wait";
  const nav = view === "deploy" ? "market" : view;
  const showBanner = Boolean(running && !(view === "jobs" && focusId === running?.id));

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setView("market")}>
            <Mark />
            <span className="brand-name">Cortex<em>DePIN</em></span>
          </button>
          <nav className="nav">
            <button className={cx(nav === "market" && "active")} type="button" onClick={() => setView("market")}>Marketplace</button>
            <button className={cx(nav === "jobs" && "active")} type="button" onClick={() => setView("jobs")}>
              Jobs {jobs.length > 0 && <em className="count">{jobs.length}</em>}
            </button>
            <button className={cx(nav === "attest" && "active")} type="button" onClick={() => setView("attest")}>Attestations</button>
            <button className={cx(nav === "supply" && "active")} type="button" onClick={() => setView("supply")}>Supply</button>
          </nav>
          <div className="spacer" />
          <div className="net-pill"><span className="live" /> Solana devnet · simulated</div>
          <WalletControl
            wallet={wallet}
            open={menuOpen}
            onToggle={() => setMenuOpen((value) => !value)}
            onClose={closeMenu}
            onConnect={() => setWalletOpen(true)}
            onCopy={() => void copyAddress()}
            onAttest={() => {
              setMenuOpen(false);
              setView("attest");
            }}
            onReset={resetDemo}
            onDisconnect={() => {
              setWallet(null);
              setMenuOpen(false);
              setToast("Wallet disconnected.");
            }}
          />
        </div>
      </header>

      <main className="shell">
        <ol className="steps">
          <li className={stepConnect}><span>{stepConnect === "done" ? "✓" : "1"}</span>Connect wallet</li>
          <li className={stepDeploy}><span>{stepDeploy === "done" ? "✓" : "2"}</span>Deploy a job</li>
          <li className={stepStream}><span>{stepStream === "done" ? "✓" : "3"}</span>Stream payment</li>
          <li className={stepProof}><span>{stepProof === "done" ? "✓" : "4"}</span>Read the proof</li>
        </ol>

        {view === "market" && <Market nodes={nodes} jobs={jobs} onDeploy={deploy} />}
        {view === "deploy" && selected && wallet && (
          <Deploy node={selected} balanceSol={wallet.sol} onBack={() => setView("market")} onSubmit={startJob} />
        )}
        {view === "jobs" && (
          <Jobs
            jobs={jobs}
            focusId={focusId}
            onFocus={setFocusId}
            onBack={() => setFocusId(null)}
            onAttest={(id) => {
              setAttestId(id);
              setView("attest");
            }}
          />
        )}
        {view === "attest" && <Attest jobs={jobs} selectedId={attestId} onSelect={setAttestId} />}
        {view === "supply" && <Supply nodes={nodes} onList={listNode} />}
        <p className="footer">Demo only. Wallets, jobs, micropayments, and attestations stay in the browser. Nothing is broadcast to Solana.</p>
      </main>

      {showBanner && running && (
        <button
          className="banner"
          type="button"
          onClick={() => {
            setFocusId(running.id);
            setView("jobs");
          }}
        >
          <span>{running.id} is streaming · {formatUsd(running.spentUsd)} released</span>
          <span className="btn primary">View</span>
        </button>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
      <ConnectModal open={walletOpen} onClose={() => setWalletOpen(false)} onConnected={connect} />
    </div>
  );
}
