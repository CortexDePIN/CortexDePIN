import { fakeHash, fakeSig } from "./format";
import type { GpuNode, Job, ProofEvent, WalletKind, Workload } from "./types";

export const WALLETS: Record<WalletKind, { address: string; sol: number }> = {
  Phantom: { address: "7kXw9pL2mQv8cR4nT6sY1uH3aBdEfGhJkLmNoPqRsTu", sol: 18.42 },
  Solflare: { address: "4sNq2vR8kL9pXw3cD7fG5hJ1mB6tY8uZ2aC4eH7jK9Lm", sol: 6.08 },
  Backpack: { address: "9cH3kP7mN2qR5tV8wX1yZ4aB6dE8fG2hJ5kL7nP3qRs", sol: 11.9 },
};

export const GPU_CATALOG: Array<{ gpu: string; vram: string; workloads: Workload[] }> = [
  { gpu: "NVIDIA H100 80GB", vram: "80GB", workloads: ["Inference", "Fine-tune", "Training"] },
  { gpu: "NVIDIA H200 141GB", vram: "141GB", workloads: ["Inference", "Fine-tune", "Training"] },
  { gpu: "NVIDIA A100 80GB", vram: "80GB", workloads: ["Inference", "Fine-tune", "Training"] },
  { gpu: "AMD MI300X 192GB", vram: "192GB", workloads: ["Inference", "Fine-tune", "Training"] },
  { gpu: "NVIDIA L40S 48GB", vram: "48GB", workloads: ["Inference", "Fine-tune"] },
  { gpu: "NVIDIA RTX 4090 24GB", vram: "24GB", workloads: ["Inference"] },
];

export const INFERENCE_PROMPT =
  "Explain how CortexDePIN pays GPU providers only when the inference actually ran.";

export const FINETUNE_NOTE =
  "Dataset: support-tickets-v3 (simulated, 48k rows). Method: LoRA rank 16, 1 epoch.";

export const TRAIN_NOTE =
  "Corpus: curated technical mix (simulated). Objective: continued pretraining, 200 steps.";

const INFERENCE_OUTPUT = `A requester locks escrow on Solana before any tokens are generated. The provider then runs the assigned model and commits each slice of work: model id, input hash, and output hash.

Independent validators recompute that commitment. When a quorum agrees the slice matches the advertised GPU, a micropayment leaves escrow and settles to the provider. Slices that fail the check are not paid.

At the end of the job the program closes the escrow. Unused buffer returns to the requester, and the final attestation is stored beside the settlement signature so the run can be audited later.

That is the whole loop: post capacity, match a job, stream payment only for compute that was actually executed.`;

export const MODELS: Record<Workload, string[]> = {
  Inference: ["Llama 3.1 8B Instruct", "Llama 3.1 70B Instruct", "Mistral Small 24B", "Qwen2.5 32B"],
  "Fine-tune": ["Llama 3.1 8B LoRA", "Mistral 7B LoRA", "Qwen2.5 7B LoRA"],
  Training: ["Llama 3.1 8B continued", "MoE 8x7B continued"],
};

export const TAPE = [
  "Helios Forge settled 0.0412 SOL · inference",
  "Northlattice attested an H200 slice · 3/3 quorum",
  "KiteGPU released a micropayment · fine-tune",
  "Atlas Bay locked escrow · training job",
  "Costa Node published L40S capacity · São Paulo",
  "Pacific Tensor finalized output hash · MI300X",
  "Drift Silicon refunded unused buffer · 0.008 SOL",
  "Amber Rack passed GPU attestation · London",
];

export const VALIDATORS = ["Lattice Guard", "SolProof", "North Quorum"];

const SEED: GpuNode[] = [
  { id: "helios", name: "Helios Forge", region: "FRA", city: "Frankfurt", gpu: "NVIDIA H100 80GB", vram: "80GB", usdPerHour: 6.2, uptime: 99.97, attested: 99.6, jobs: 14820, workloads: ["Inference", "Fine-tune", "Training"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "north", name: "Northlattice", region: "SWE", city: "Stockholm", gpu: "NVIDIA H200 141GB", vram: "141GB", usdPerHour: 8.4, uptime: 99.99, attested: 99.8, jobs: 9022, workloads: ["Inference", "Fine-tune", "Training"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "pacific", name: "Pacific Tensor", region: "JPN", city: "Tokyo", gpu: "AMD MI300X 192GB", vram: "192GB", usdPerHour: 7.1, uptime: 99.91, attested: 99.1, jobs: 6404, workloads: ["Inference", "Fine-tune", "Training"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "atlas", name: "Atlas Bay", region: "USA", city: "Ashburn", gpu: "NVIDIA H100 80GB", vram: "80GB", usdPerHour: 5.9, uptime: 99.94, attested: 99.4, jobs: 12110, workloads: ["Inference", "Fine-tune", "Training"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "kite", name: "KiteGPU", region: "SGP", city: "Singapore", gpu: "NVIDIA A100 80GB", vram: "80GB", usdPerHour: 3.4, uptime: 99.88, attested: 98.7, jobs: 8340, workloads: ["Inference", "Fine-tune", "Training"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "drift", name: "Drift Silicon", region: "USA", city: "Austin", gpu: "NVIDIA A100 40GB", vram: "40GB", usdPerHour: 2.4, uptime: 99.72, attested: 98.2, jobs: 4102, workloads: ["Inference", "Fine-tune"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "costa", name: "Costa Node", region: "BRA", city: "São Paulo", gpu: "NVIDIA L40S 48GB", vram: "48GB", usdPerHour: 1.65, uptime: 99.84, attested: 99.0, jobs: 2755, workloads: ["Inference", "Fine-tune"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "amber", name: "Amber Rack", region: "GBR", city: "London", gpu: "NVIDIA L40S 48GB", vram: "48GB", usdPerHour: 1.8, uptime: 99.63, attested: 97.9, jobs: 1988, workloads: ["Inference"], status: "open", owner: "network", earnedUsd: 0 },
  { id: "mesa", name: "Mesa Compute", region: "USA", city: "Phoenix", gpu: "NVIDIA RTX 4090 24GB", vram: "24GB", usdPerHour: 0.72, uptime: 98.4, attested: 96.4, jobs: 860, workloads: ["Inference"], status: "busy", owner: "network", earnedUsd: 0 },
];

export function seedNodes(): GpuNode[] {
  return SEED.map((node) => ({ ...node, workloads: [...node.workloads] }));
}

function lossLines(prefix: string, losses: number[]) {
  return losses
    .map((loss, index) => {
      const step = (index + 1) * 20;
      const gpu = 94 + ((index * 3) % 5);
      return `${prefix}  step ${String(step).padStart(3, " ")}   loss ${loss.toFixed(3)}   gpu ${gpu}%`;
    })
    .join("\n");
}

export function buildOutput(workload: Workload, model: string, nodeName: string) {
  if (workload === "Inference") return INFERENCE_OUTPUT;
  if (workload === "Fine-tune") {
    return [
      `adapter ${model}  host ${nodeName}`,
      "lora rank 16  alpha 32  dropout 0.05",
      lossLines("epoch 1", [1.82, 1.44, 1.11, 0.86, 0.67, 0.53, 0.42, 0.35]),
      "checkpoint adapter.safetensors written",
      "output commitment ready for quorum",
    ].join("\n");
  }
  return [
    `run ${model}  host ${nodeName}`,
    "seq 2048  global batch 64  lr 3.0e-4",
    lossLines("train", [2.94, 2.71, 2.48, 2.22, 1.98, 1.76, 1.55, 1.39, 1.24, 1.12, 1.02, 0.94]),
    "checkpoint step 240 written",
    "output commitment ready for quorum",
  ].join("\n");
}

function eventsFor(gpu: string): ProofEvent[] {
  return [
    { id: "e1", label: "Input commitment posted to Solana" },
    { id: "e2", label: `GPU attestation matched ${gpu}` },
    { id: "e3", label: "Validators accepted slice 1 of 4" },
    { id: "e4", label: "Micropayment released to the provider" },
    { id: "e5", label: "Slice 3 of 4 attested · stream continued" },
    { id: "e6", label: "Output hash finalized · 3 of 3 validators signed" },
  ];
}

let jobCounter = 0;

export function createJob(args: {
  node: GpuNode;
  workload: Workload;
  model: string;
  input: string;
  quoteUsd: number;
  escrowUsd: number;
}): Job {
  jobCounter += 1;
  const id = `cx_${Date.now().toString(16).slice(-4)}${jobCounter.toString(16)}`;
  const output = buildOutput(args.workload, args.model, args.node.name);
  return {
    id,
    nodeId: args.node.id,
    nodeName: args.node.name,
    gpu: args.node.gpu,
    region: args.node.region,
    workload: args.workload,
    model: args.model,
    input: args.input,
    status: "running",
    progress: 0,
    escrowUsd: args.escrowUsd,
    quoteUsd: args.quoteUsd,
    spentUsd: 0,
    inputHash: fakeHash(`${args.input}:${args.model}`),
    outputHash: fakeHash(`${output}:${id}`),
    tx: fakeSig(`${id}:settle`),
    events: eventsFor(args.node.gpu),
    revealedEvents: 0,
    output,
    shown: "",
  };
}

export function advanceJob(job: Job): Job {
  if (job.status !== "running") return job;
  const progress = Math.min(1, job.progress + 0.0084);
  const lines = job.output.split("\n");
  const shown =
    job.workload === "Inference"
      ? job.output.slice(0, Math.max(0, Math.floor(progress * job.output.length)))
      : lines.slice(0, progress === 0 ? 0 : Math.max(1, Math.floor(progress * lines.length))).join("\n");
  const revealedEvents = Math.min(job.events.length, Math.floor(progress * job.events.length + 0.001));
  if (progress >= 1) {
    return {
      ...job,
      status: "verified",
      progress: 1,
      spentUsd: job.quoteUsd,
      shown: job.output,
      revealedEvents: job.events.length,
    };
  }
  return {
    ...job,
    progress,
    spentUsd: job.quoteUsd * progress,
    shown,
    revealedEvents,
  };
}
