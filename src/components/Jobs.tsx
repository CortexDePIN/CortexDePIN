import { useEffect, useRef } from "react";
import { clipHash, cx, formatUsd } from "../format";
import type { Job } from "../types";

function LossChart({ text }: { text: string }) {
  const losses = [...text.matchAll(/loss\s([0-9.]+)/g)].map((match) => Number(match[1]));
  if (losses.length < 2) return null;
  const min = Math.min(...losses);
  const max = Math.max(...losses);
  const coords = losses.map((value, index) => {
    const x = (index / (losses.length - 1)) * 100;
    const y = 6 + ((max - value) / (max - min || 1)) * 36;
    return `${x},${y}`;
  });
  const line = coords.join(" ");
  return (
    <svg className="chart" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,48 ${line} 100,48`} />
      <polyline points={line} />
    </svg>
  );
}

export function Jobs({
  jobs,
  focusId,
  onFocus,
  onBack,
  onAttest,
}: {
  jobs: Job[];
  focusId: string | null;
  onFocus: (id: string) => void;
  onBack: () => void;
  onAttest: (id: string) => void;
}) {
  const focused = jobs.find((job) => job.id === focusId) ?? null;
  if (!focused) {
    return (
      <section>
        <div className="page-head">
          <div>
            <h1>Jobs</h1>
            <p className="lead">Every run locks escrow, streams a result, and settles only the attested portion.</p>
          </div>
        </div>
        {jobs.length === 0 ? (
          <div className="empty">
            <h2>No jobs yet</h2>
            <p>Deploy one from the marketplace. Inference streams tokens. Training draws a loss curve.</p>
          </div>
        ) : (
          <div>
            {jobs.map((job) => (
              <button className="job-row" type="button" key={job.id} onClick={() => onFocus(job.id)}>
                <span>
                  <strong>{job.workload} · {job.model}</strong>
                  <small>{job.id} · {job.nodeName} · {job.gpu}</small>
                </span>
                <span className={cx("pill", job.status === "verified" ? "ok" : "run")}>
                  {job.status === "verified" ? "Verified" : `${Math.round(job.progress * 100)}%`}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return <JobRun job={focused} onBack={onBack} onAttest={() => onAttest(focused.id)} />;
}

function JobRun({ job, onBack, onAttest }: { job: Job; onBack: () => void; onAttest: () => void }) {
  const scroller = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [job.shown]);

  const released = job.status === "verified" ? job.quoteUsd : job.spentUsd;
  const buffer = job.escrowUsd - job.quoteUsd;
  const width = `${Math.min(100, (released / job.escrowUsd) * 100)}%`;
  const tps = 124 + Math.round((Math.sin(job.progress * 28) + 1) * 10);
  const tokens = Math.round(job.shown.length / 4);

  return (
    <section>
      <div className="run-head">
        <div>
          <button className="btn ghost crumb" type="button" onClick={onBack}>← All jobs</button>
          <h1>{job.workload}</h1>
          <p className="lead">{job.model} on {job.nodeName} · {job.gpu} · {job.region}</p>
        </div>
        <span className={cx("pill", job.status === "verified" ? "ok" : "run")}>
          {job.status === "verified" ? "Verified" : "Streaming"}
        </span>
      </div>
      <div className="split">
        <div className="panel">
          {job.status === "verified" && (
            <div className="done-row">
              <div>
                <strong>Execution attested</strong>
                <div className="sub">Quorum signed the output hash. Escrow is settled.</div>
              </div>
              <button className="btn primary" type="button" onClick={onAttest}>Open attestation</button>
            </div>
          )}
          <p className="prompt">“{job.input}”</p>
          {job.workload !== "Inference" && <LossChart text={job.shown} />}
          <pre className="output" ref={scroller}>
            {job.shown || "Waiting for the first attested slice…"}
            {job.status === "running" && job.workload === "Inference" && job.shown && <span className="caret" />}
          </pre>
        </div>
        <aside className="stack">
          <div className="panel">
            <p className="kicker">Escrow</p>
            <div className="stats">
              <div className="stat"><span>Released</span><b className="num">{formatUsd(released)}</b></div>
              <div className="stat"><span>{job.status === "verified" ? "Refunded" : "Buffer"}</span><b className="num">{formatUsd(buffer)}</b></div>
              <div className="stat">
                <span>{job.workload === "Inference" ? "Tokens" : "Progress"}</span>
                <b className="num">{job.workload === "Inference" ? tokens : `${Math.round(job.progress * 100)}%`}</b>
              </div>
            </div>
            <div className="track" aria-hidden="true"><div className="fill" style={{ width }} /></div>
            <div className="quote-line">
              <span>Locked</span>
              <b>{formatUsd(job.escrowUsd)}</b>
            </div>
            {job.workload === "Inference" && job.status === "running" && (
              <div className="quote-line"><span>Throughput</span><b className="num">{tps} tok/s</b></div>
            )}
            <p className="sub">Micropayments move only after a slice is attested. The buffer returns when the job closes.</p>
          </div>
          <div className="panel">
            <p className="kicker">Proof stream</p>
            <ul className="events">
              {job.events.map((event, index) => (
                <li key={event.id} className={index < job.revealedEvents ? "on" : undefined}>{event.label}</li>
              ))}
            </ul>
            {job.revealedEvents > 0 && (
              <p className="sub" style={{ marginTop: 12 }}>Input {clipHash(job.inputHash)}</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
