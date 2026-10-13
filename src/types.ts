export type Workload = "Inference" | "Fine-tune" | "Training";

export type WalletKind = "Phantom" | "Solflare" | "Backpack";

export type Wallet = {
  kind: WalletKind;
  address: string;
  sol: number;
};

export type NodeStatus = "open" | "busy";

export type GpuNode = {
  id: string;
  name: string;
  region: string;
  city: string;
  gpu: string;
  vram: string;
  usdPerHour: number;
  uptime: number;
  attested: number;
  jobs: number;
  workloads: Workload[];
  status: NodeStatus;
  owner: "network" | "you";
  earnedUsd: number;
};

export type ProofEvent = {
  id: string;
  label: string;
};

export type Job = {
  id: string;
  nodeId: string;
  nodeName: string;
  gpu: string;
  region: string;
  workload: Workload;
  model: string;
  input: string;
  status: "running" | "verified";
  progress: number;
  escrowUsd: number;
  quoteUsd: number;
  spentUsd: number;
  inputHash: string;
  outputHash: string;
  tx: string;
  events: ProofEvent[];
  revealedEvents: number;
  output: string;
  shown: string;
};

export type View = "market" | "deploy" | "jobs" | "attest" | "supply";
