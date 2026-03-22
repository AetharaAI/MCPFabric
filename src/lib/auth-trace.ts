export interface AuthTraceEntry {
  id: string;
  at: string;
  stage: string;
  message: string;
  details?: Record<string, unknown>;
}

const TRACE_KEY = "mcpfabric.passport.trace";
const TRACE_LIMIT = 80;

const SENSITIVE_KEYS = new Set([
  "access_token",
  "refresh_token",
  "id_token",
  "client_secret",
  "code",
  "state",
  "code_verifier",
  "verifier",
  "authorization",
]);

function summarizeValue(value: string): string {
  if (!value) {
    return "[empty]";
  }
  if (value.length <= 8) {
    return `[redacted:${value.length}]`;
  }
  return `${value.slice(0, 4)}...[${value.length}]`;
}

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return value.length > 180 ? `${value.slice(0, 177)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.toLowerCase();
      if (SENSITIVE_KEYS.has(normalized) || normalized.includes("token") || normalized.includes("secret")) {
        result[key] = typeof raw === "string" ? summarizeValue(raw) : "[redacted]";
      } else {
        result[key] = sanitize(raw);
      }
    }
    return result;
  }

  return value;
}

function readTrace(): AuthTraceEntry[] {
  try {
    const raw = sessionStorage.getItem(TRACE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AuthTraceEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    sessionStorage.removeItem(TRACE_KEY);
    return [];
  }
}

function writeTrace(entries: AuthTraceEntry[]) {
  sessionStorage.setItem(TRACE_KEY, JSON.stringify(entries.slice(-TRACE_LIMIT)));
}

export function logAuthTrace(stage: string, message: string, details?: Record<string, unknown>) {
  const entry: AuthTraceEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    stage,
    message,
    details: details ? (sanitize(details) as Record<string, unknown>) : undefined,
  };

  const entries = readTrace();
  entries.push(entry);
  writeTrace(entries);
  console.info(`[MCPFabric Auth][${stage}] ${message}`, entry.details || {});
}

export function getAuthTrace(): AuthTraceEntry[] {
  return readTrace();
}

export function clearAuthTrace() {
  sessionStorage.removeItem(TRACE_KEY);
}
