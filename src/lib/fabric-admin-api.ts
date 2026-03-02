export type KeyScope = "full" | "tools_only" | "read_only" | "admin";

export interface AdminVerifyResponse {
  ok: boolean;
  method: "master_key" | "api_key";
  scope?: KeyScope | "admin";
  owner_id?: string;
  key_id?: string;
  name?: string;
  rate_limit_rpm?: number;
  expires_at?: string | null;
}

export interface FabricKeySummary {
  id: string;
  name: string;
  prefix: string;
  scope: KeyScope;
  owner_id: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked: boolean;
  rate_limit_rpm: number;
  allowed_agents: string[];
}

export interface CreateKeyPayload {
  name: string;
  owner_id: string;
  scope: KeyScope;
  expires_in_days?: number | null;
  rate_limit_rpm: number;
  allowed_agents?: string[];
  test?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateKeyResponse {
  key: string;
  id: string;
  name: string;
  prefix: string;
  scope: KeyScope;
  owner_id: string;
  created_at: string;
  expires_at: string | null;
  rate_limit_rpm: number;
  test: boolean;
}

const DEFAULT_BASE_URL =
  (import.meta.env.VITE_FABRIC_API_BASE as string | undefined)?.trim() ||
  "https://fabric.perceptor.us";

export function getDefaultBaseUrl(): string {
  return normalizeBaseUrl(DEFAULT_BASE_URL);
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const obj = payload as Record<string, unknown>;
  if (typeof obj.detail === "string") {
    return obj.detail;
  }
  if (typeof obj.message === "string") {
    return obj.message;
  }

  const error = obj.error as Record<string, unknown> | undefined;
  if (error && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

async function requestJson<T>(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    const fallback = `Request failed (${response.status})`;
    throw new Error(extractErrorMessage(payload, fallback));
  }

  return payload as T;
}

export async function verifyAdmin(
  baseUrl: string,
  token: string,
): Promise<AdminVerifyResponse> {
  return requestJson<AdminVerifyResponse>(
    `${normalizeBaseUrl(baseUrl)}/admin/verify`,
    token,
  );
}

export async function listKeys(
  baseUrl: string,
  token: string,
  ownerId?: string,
): Promise<FabricKeySummary[]> {
  const endpoint = ownerId
    ? `${normalizeBaseUrl(baseUrl)}/admin/keys?owner_id=${encodeURIComponent(ownerId)}`
    : `${normalizeBaseUrl(baseUrl)}/admin/keys`;

  return requestJson<FabricKeySummary[]>(endpoint, token);
}

export async function createKey(
  baseUrl: string,
  token: string,
  payload: CreateKeyPayload,
): Promise<CreateKeyResponse> {
  return requestJson<CreateKeyResponse>(
    `${normalizeBaseUrl(baseUrl)}/admin/keys`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function revokeKey(
  baseUrl: string,
  token: string,
  keyId: string,
): Promise<{ ok: boolean; key_id: string; message: string }> {
  return requestJson<{ ok: boolean; key_id: string; message: string }>(
    `${normalizeBaseUrl(baseUrl)}/admin/keys/${encodeURIComponent(keyId)}`,
    token,
    {
      method: "DELETE",
    },
  );
}
