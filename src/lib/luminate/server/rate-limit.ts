import { NextRequest } from "next/server";

interface RequestRecord {
  timestamps: number[];
}

interface ConcurrencyRecord {
  active: number;
}

const requestMap = new Map<string, RequestRecord>();
const concurrencyMap = new Map<string, ConcurrencyRecord>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CONCURRENT_AGENT_SESSIONS = 2;

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestMap) {
    record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);
    if (record.timestamps.length === 0) requestMap.delete(ip);
  }
}, 300_000);

function getIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(request: NextRequest): Response | null {
  const ip = getIP(request);
  const now = Date.now();

  const record = requestMap.get(ip) || { timestamps: [] };
  record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  record.timestamps.push(now);
  requestMap.set(ip, record);
  return null;
}

export function acquireAgentSession(request: NextRequest): Response | null {
  const ip = getIP(request);
  const record = concurrencyMap.get(ip) || { active: 0 };

  if (record.active >= MAX_CONCURRENT_AGENT_SESSIONS) {
    return new Response(
      JSON.stringify({
        error: "Too many active editing sessions. Please wait for one to finish.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  record.active++;
  concurrencyMap.set(ip, record);
  return null;
}

export function releaseAgentSession(request: NextRequest): void {
  const ip = getIP(request);
  const record = concurrencyMap.get(ip);
  if (record && record.active > 0) {
    record.active--;
    if (record.active === 0) concurrencyMap.delete(ip);
  }
}
