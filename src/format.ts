import type { Workload } from "./types";

export const SOL_USD = 148.2;

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function roundUsd(n: number) {
  return Math.round(n * 100) / 100;
}

export function roundSol(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

export function formatUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSol(n: number, digits = 4) {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} SOL`;
}

export function formatSolShort(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function shortAddr(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function quoteFor(usdPerHour: number, workload: Workload) {
  const hours = workload === "Inference" ? 0.35 : workload === "Fine-tune" ? 0.8 : 1.5;
  const windowLabel =
    workload === "Inference" ? "21 min burst" : workload === "Fine-tune" ? "48 min job" : "90 min job";
  const quoteUsd = roundUsd(usdPerHour * hours);
  const escrowUsd = roundUsd(quoteUsd * 1.55);
  return { quoteUsd, escrowUsd, hours, windowLabel };
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function fakeHash(seed: string, len = 64) {
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    x ^= seed.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  let out = "";
  while (out.length < len) {
    x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}

export function fakeSig(seed: string, len = 87) {
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    x ^= seed.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  let out = "";
  while (out.length < len) {
    x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
    out += B58[x % B58.length];
  }
  return out.slice(0, len);
}

export function clipHash(hash: string) {
  return `${hash.slice(0, 12)}…${hash.slice(-8)}`;
}
