import { VALIDATORS } from "../data";
import { clipHash, formatSol, formatUsd, SOL_USD } from "../format";
import type { Job } from "../types";

export function Attest({
  jobs,
  selectedId,
  onSelect,
}: {
  jobs: Job[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const verified = jobs.filter((job) => job.status === "verified");
  const current = verified.find((job) => job.id === selectedId) ?? verified[0] ?? null;

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Attestations</h1>
          <p className="lead">
            A finished job carries the input hash, the output hash, the GPU attestation, and the validator quorum that released payment.
          </p>
        </div>
      </div>
      {current === null ? (
        <div className="empty">
          <h2>No proofs yet</h2>
          <p>Run a job to the end. The certificate shows up here once the quorum signs.</p>
        </div>
      ) : (
        <div className="split">
          <div>
            {verified.map((job) => (
              <button key={job.id} className="attest-row" type="button" onClick={() => onSelect(job.id)}>
                <span>
                  <strong>{job.id}</strong>
                  <small>{job.workload} · {job.nodeName}</small>
                </span>
                <span className="pill ok">Verified</span>
              </button>
            ))}
          </div>
          <article className="cert">
            <div className="seal">Verified</div>
            <p className="kicker">Cortex attestation</p>
            <h2>{current.id}</h2>
            <p className="muted" style={{ marginBottom: 8 }}>{current.workload} · {current.model}</p>
            <div className="kv"><span>Provider</span><b>{current.nodeName}</b></div>
            <div className="kv"><span>Hardware</span><b>{current.gpu}</b></div>
            <div className="kv"><span>Region</span><b>{current.region}</b></div>
            <div className="kv"><span>Input hash</span><b className="hash" title={current.inputHash}>{clipHash(current.inputHash)}</b></div>
            <div className="kv"><span>Output hash</span><b className="hash" title={current.outputHash}>{clipHash(current.outputHash)}</b></div>
            <div className="kv"><span>Paid</span><b>{formatUsd(current.quoteUsd)} · {formatSol(current.quoteUsd / SOL_USD)}</b></div>
            <div className="kv"><span>Refunded</span><b>{formatUsd(current.escrowUsd - current.quoteUsd)}</b></div>
            <div className="kv"><span>Settlement</span><b className="hash" title={current.tx}>{clipHash(current.tx)}</b></div>
            <div className="validators">
              {VALIDATORS.map((name) => (
                <span key={name}>{name} · signed</span>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
