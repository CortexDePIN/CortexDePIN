import { useState } from "react";
import { FINETUNE_NOTE, INFERENCE_PROMPT, MODELS, TRAIN_NOTE } from "../data";
import { formatSol, formatUsd, quoteFor, roundSol, SOL_USD } from "../format";
import type { GpuNode, Workload } from "../types";

const FEE_SOL = 0.000005;

export function Deploy({
  node,
  balanceSol,
  onBack,
  onSubmit,
}: {
  node: GpuNode;
  balanceSol: number;
  onBack: () => void;
  onSubmit: (draft: { workload: Workload; model: string; input: string; quoteUsd: number; escrowUsd: number }) => void;
}) {
  const [workload, setWorkload] = useState<Workload>(node.workloads[0]);
  const [model, setModel] = useState(MODELS[node.workloads[0]][0]);
  const [input, setInput] = useState(INFERENCE_PROMPT);
  const [phase, setPhase] = useState<"edit" | "approve" | "signing">("edit");
  const [error, setError] = useState<string | null>(null);

  const quote = quoteFor(node.usdPerHour, workload);
  const escrowSol = roundSol(quote.escrowUsd / SOL_USD);

  function chooseWorkload(next: Workload) {
    setWorkload(next);
    setModel(MODELS[next][0]);
    setInput(next === "Inference" ? INFERENCE_PROMPT : next === "Fine-tune" ? FINETUNE_NOTE : TRAIN_NOTE);
  }

  function askApproval() {
    if (!input.trim()) {
      setError("Add a prompt or dataset note before locking escrow.");
      return;
    }
    setError(null);
    if (balanceSol < escrowSol + FEE_SOL) {
      setError("Not enough SOL in the simulated wallet.");
      return;
    }
    setPhase("approve");
  }

  function confirm() {
    setPhase("signing");
    window.setTimeout(() => {
      onSubmit({ workload, model, input: input.trim(), quoteUsd: quote.quoteUsd, escrowUsd: quote.escrowUsd });
    }, 900);
  }

  return (
    <section>
      <button className="btn ghost crumb" type="button" onClick={onBack}>← Market</button>
      <div className="page-head">
        <div>
          <h1>New job</h1>
          <p className="lead">
            {node.name} · {node.gpu} · {node.city}. Escrow is locked up front and released in micropayments as proofs land.
          </p>
        </div>
      </div>
      <div className="split">
        <div className="panel">
          <p className="kicker">Workload</p>
          <div className="filters" style={{ marginBottom: 14 }}>
            {node.workloads.map((item) => (
              <button key={item} className={item === workload ? "chip on" : "chip"} type="button" onClick={() => chooseWorkload(item)}>
                {item}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Model</span>
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {MODELS[workload].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{workload === "Inference" ? "Prompt" : "Job note"}</span>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} />
          </label>
          {error && <p className="muted">{error}</p>}
          <button className="btn primary" type="button" onClick={askApproval}>Lock escrow and start</button>
        </div>
        <aside className="panel">
          <p className="kicker">Quote</p>
          <h2>{node.name}</h2>
          <p className="muted">{node.gpu} · {node.region}</p>
          <div className="quote-box">
            <div className="quote-line"><span>Posted rate</span><b>{formatUsd(node.usdPerHour)} / hour</b></div>
            <div className="quote-line"><span>Attested window</span><b>{quote.windowLabel}</b></div>
            <div className="quote-line"><span>Job quote</span><b>{formatUsd(quote.quoteUsd)}</b></div>
            <div className="quote-line"><span>Escrow buffer</span><b>{formatUsd(quote.escrowUsd - quote.quoteUsd)}</b></div>
            <div className="quote-line"><span>SOL / USD</span><b className="num">{SOL_USD.toFixed(2)}</b></div>
          </div>
          <div className="kicker">Lock</div>
          <div className="quote-total num">{formatSol(escrowSol)}</div>
          <p className="sub">{formatUsd(quote.escrowUsd)} leaves the wallet until the job settles. Unused buffer is refunded.</p>
        </aside>
      </div>

      {phase !== "edit" && (
        <div className="backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="approve-title">
            <p className="kicker">Simulated wallet</p>
            <h2 id="approve-title">Approve escrow</h2>
            <p className="muted">CortexDePIN will lock funds on Solana devnet. This signature is simulated.</p>
            <div className="quote-box">
              <div className="quote-line"><span>Program</span><b>Cortex escrow</b></div>
              <div className="quote-line"><span>Job</span><b>{workload} · {model}</b></div>
              <div className="quote-line"><span>Provider</span><b>{node.name}</b></div>
              <div className="quote-line"><span>Escrow</span><b className="num">{formatSol(escrowSol)}</b></div>
              <div className="quote-line"><span>Network fee</span><b className="num">{formatSol(FEE_SOL, 6)}</b></div>
            </div>
            {phase === "signing" ? (
              <div className="signing"><span className="spin" /> Submitting transaction…</div>
            ) : (
              <div className="row-2">
                <button className="btn ghost" type="button" onClick={() => setPhase("edit")}>Reject</button>
                <button className="btn primary" type="button" onClick={confirm}>Approve</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
