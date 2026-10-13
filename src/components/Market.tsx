import { useMemo, useState } from "react";
import { TAPE } from "../data";
import { cx, formatSol, formatUsd, SOL_USD } from "../format";
import type { GpuNode, Job, Workload } from "../types";

const FAMILIES = ["All", "H200", "H100", "MI300X", "A100", "L40S", "4090"] as const;
type Family = (typeof FAMILIES)[number];
type SortKey = "featured" | "price" | "attested";

function familyOf(gpu: string): Family {
  const match = FAMILIES.find((item) => item !== "All" && gpu.includes(item));
  return match ?? "All";
}

export function Market({
  nodes,
  jobs,
  onDeploy,
}: {
  nodes: GpuNode[];
  jobs: Job[];
  onDeploy: (id: string) => void;
}) {
  const [family, setFamily] = useState<Family>("All");
  const [workload, setWorkload] = useState<"All" | Workload>("All");
  const [sort, setSort] = useState<SortKey>("featured");

  const visible = useMemo(() => {
    const filtered = nodes.filter((node) => {
      const familyOk = family === "All" || familyOf(node.gpu) === family;
      const workOk = workload === "All" || node.workloads.includes(workload);
      return familyOk && workOk;
    });
    const ranked = [...filtered];
    if (sort === "price") ranked.sort((a, b) => a.usdPerHour - b.usdPerHour);
    if (sort === "attested") ranked.sort((a, b) => b.attested - a.attested);
    return ranked;
  }, [nodes, family, workload, sort]);

  const settled =
    418.62 +
    jobs.filter((job) => job.status === "verified").reduce((sum, job) => sum + job.quoteUsd / SOL_USD, 0);

  const tape = [...TAPE, ...TAPE];

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Marketplace</h1>
          <p className="lead">
            Rent GPUs for inference and training. Escrow on Solana streams to the provider only as each slice of compute is verified.
          </p>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>GPUs online</span>
          <b className="num">{(1284 + nodes.filter((node) => node.owner === "you").length).toLocaleString("en-US")}</b>
        </div>
        <div className="metric">
          <span>Active jobs</span>
          <b className="num">{86 + jobs.filter((job) => job.status === "running").length}</b>
        </div>
        <div className="metric">
          <span>Attested today</span>
          <b className="num">{(12409 + jobs.filter((job) => job.status === "verified").length).toLocaleString("en-US")}</b>
        </div>
        <div className="metric">
          <span>Settled today</span>
          <b className="num">{formatSol(settled)}</b>
        </div>
      </div>

      <div className="tape" aria-hidden="true">
        <div className="tape-track">
          {tape.map((item, index) => (
            <span key={`${item}-${index}`}>
              <i>●</i>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          {FAMILIES.map((item) => (
            <button key={item} className={cx("chip", family === item && "on")} type="button" onClick={() => setFamily(item)}>
              {item}
            </button>
          ))}
          {(["All", "Inference", "Fine-tune", "Training"] as const).map((item) => (
            <button key={item} className={cx("chip", workload === item && "on")} type="button" onClick={() => setWorkload(item)}>
              {item === "All" ? "Any job" : item}
            </button>
          ))}
        </div>
        <select className="sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort capacity">
          <option value="featured">Featured</option>
          <option value="price">Lowest price</option>
          <option value="attested">Highest attested</option>
        </select>
      </div>

      <div className="grid">
        {visible.map((node) => (
          <article key={node.id} className={cx("card", node.owner === "you" && "yours", node.status === "busy" && "busy")}>
            <div className="card-top">
              <div>
                <div className="badge">{node.owner === "you" ? "Your node" : node.status === "busy" ? "Busy" : "Open"}</div>
                <div className="node-name">{node.name}</div>
                <div className="gpu-name">{node.gpu}</div>
              </div>
              <span className="region">{node.region} · {node.city}</span>
            </div>
            <div className="price">
              <strong>{formatUsd(node.usdPerHour)}</strong>
              <span> / hour</span>
              <div className="sub num">{formatSol(node.usdPerHour / SOL_USD)} / hour</div>
            </div>
            <div className="meta">
              <span>{node.uptime.toFixed(2)}% up</span>
              <span>{node.owner === "you" && node.jobs === 0 ? "New" : `${node.attested.toFixed(1)}% attested`}</span>
              <span>{node.jobs.toLocaleString("en-US")} jobs</span>
            </div>
            <div className="tags">
              {node.workloads.map((item) => (
                <span className="tag" key={item}>{item}</span>
              ))}
            </div>
            {node.owner === "you" && <div className="sub">Earned {formatUsd(node.earnedUsd)}</div>}
            <button className="btn primary" type="button" disabled={node.status === "busy"} onClick={() => onDeploy(node.id)}>
              {node.status === "busy" ? "Capacity busy" : "Deploy job"}
            </button>
          </article>
        ))}
      </div>
      {visible.length === 0 && <div className="empty"><h2>No capacity in this filter</h2><p>Clear a chip to see the rest of the book.</p></div>}
    </section>
  );
}
