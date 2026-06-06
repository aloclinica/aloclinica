#!/usr/bin/env node
const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (!token.startsWith("--")) continue;
  const [key, inlineValue] = token.split("=");
  const next = process.argv[i + 1];
  const value = inlineValue ?? (!next?.startsWith("--") ? next : "true");
  if (inlineValue === undefined && next && !next.startsWith("--")) i += 1;
  args.set(key.slice(2), value);
}

const target = String(args.get("target") ?? process.env.LOAD_TARGET ?? "https://aloclinica.com.br/health");
const durationSeconds = Number(args.get("duration") ?? process.env.LOAD_DURATION_SECONDS ?? 30);
const concurrency = Number(args.get("concurrency") ?? process.env.LOAD_CONCURRENCY ?? 25);
const timeoutMs = Number(args.get("timeout") ?? process.env.LOAD_TIMEOUT_MS ?? 10000);

const endAt = Date.now() + durationSeconds * 1000;
const latencies = [];
let requests = 0;
let ok = 0;
let failed = 0;
let statusErrors = 0;

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function once() {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "aloclinica-load-baseline/1.0" },
    });
    const latency = performance.now() - startedAt;
    latencies.push(latency);
    requests += 1;
    if (response.status >= 200 && response.status < 500) ok += 1;
    else {
      failed += 1;
      statusErrors += 1;
    }
  } catch {
    requests += 1;
    failed += 1;
  } finally {
    clearTimeout(timer);
  }
}

async function worker() {
  while (Date.now() < endAt) {
    await once();
  }
}

console.log(`HTTP baseline load test`);
console.log(`Target: ${target}`);
console.log(`Duration: ${durationSeconds}s | Concurrency: ${concurrency}`);
console.log("Note: this validates HTTP capacity only. It does not simulate WebRTC media traffic.");

const startedAt = Date.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const elapsedSeconds = (Date.now() - startedAt) / 1000;

const result = {
  target,
  durationSeconds: Number(elapsedSeconds.toFixed(1)),
  concurrency,
  requests,
  ok,
  failed,
  statusErrors,
  requestsPerSecond: Number((requests / elapsedSeconds).toFixed(2)),
  p50Ms: Math.round(percentile(latencies, 50)),
  p95Ms: Math.round(percentile(latencies, 95)),
  p99Ms: Math.round(percentile(latencies, 99)),
};

console.table([result]);

if (failed > 0) process.exit(1);
