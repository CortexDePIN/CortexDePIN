import { useState, type FormEvent } from "react";
import { GPU_CATALOG } from "../data";
import { formatUsd } from "../format";
import type { GpuNode } from "../types";

const SUGGESTED: Record<string, number> = {
  "NVIDIA H100 80GB": 6.2,
  "NVIDIA H200 141GB": 8.4,
  "NVIDIA A100 80GB": 3.4,
  "AMD MI300X 192GB": 7.1,
  "NVIDIA L40S 48GB": 1.8,
  "NVIDIA RTX 4090 24GB": 0.85,
};

export function Supply({
  nodes,
  onList,
}: {
  nodes: GpuNode[];
  onList: (input: { name: string; city: string; region: string; gpu: string; usdPerHour: number }) => void;
}) {
  const [name, setName] = useState("Coral Ridge");
  const [city, setCity] = useState("Miami");
  const [region, setRegion] = useState("USA");
  const [gpu, setGpu] = useState("NVIDIA RTX 4090 24GB");
  const [price, setPrice] = useState("0.85");
  const [error, setError] = useState<string | null>(null);
  const mine = nodes.filter((node) => node.owner === "you");
  const earned = mine.reduce((sum, node) => sum + node.earnedUsd, 0);

  function submit(event: FormEvent) {
    event.preventDefault();
    const usdPerHour = Number(price);
    if (!name.trim() || !city.trim()) {
      setError("Name and city are required.");
      return;
    }
    if (!Number.isFinite(usdPerHour) || usdPerHour <= 0) {
      setError("Enter an hourly rate above zero.");
      return;
    }
    setError(null);
    onList({ name, city, region, gpu, usdPerHour });
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Supply</h1>
          <p className="lead">List hardware on the marketplace. You earn when a job on your node is attested and the escrow settles.</p>
        </div>
        <div className="metric">
          <span>Your earnings</span>
          <b className="num">{formatUsd(earned)}</b>
        </div>
      </div>
      <div className="split">
        <form className="panel" onSubmit={submit}>
          <p className="kicker">List a GPU</p>
          <div className="row-2">
            <label className="field">
              <span>Display name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="field">
              <span>City</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
          </div>
          <div className="row-2">
            <label className="field">
              <span>Region</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                {["USA", "BRA", "FRA", "GBR", "SWE", "SGP", "JPN"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Hourly rate (USD)</span>
              <input
                value={price}
                inputMode="decimal"
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>GPU</span>
            <select
              value={gpu}
              onChange={(event) => {
                const next = event.target.value;
                setGpu(next);
                setPrice(String(SUGGESTED[next] ?? 1));
              }}
            >
              {GPU_CATALOG.map((item) => (
                <option key={item.gpu}>{item.gpu}</option>
              ))}
            </select>
          </label>
          {error && <p className="muted">{error}</p>}
          <button className="btn primary" type="submit">List on marketplace</button>
        </form>
        <div className="panel">
          <p className="kicker">Your hardware</p>
          {mine.length === 0 ? (
            <p className="muted">Nothing listed yet. The form is ready — listing takes one click, then rent it from the market.</p>
          ) : (
            <div className="stack">
              {mine.map((node) => (
                <div key={node.id} className="job-row">
                  <span>
                    <strong>{node.name}</strong>
                    <small>{node.gpu} · {node.city} · {formatUsd(node.usdPerHour)}/hr</small>
                  </span>
                  <b>{formatUsd(node.earnedUsd)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
