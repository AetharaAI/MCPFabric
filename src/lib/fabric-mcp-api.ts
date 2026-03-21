import { normalizeBaseUrl } from "@/lib/fabric-admin-api";
import type { MCPRequest, MCPResponse } from "@/types/mcp";

export interface FabricAuthVerifyResponse {
  ok: boolean;
  method?: "master_key" | "api_key";
  scope?: string;
  owner_id?: string;
  key_id?: string;
  name?: string;
  rate_limit_rpm?: number;
  expires_at?: string | null;
}

export interface FabricToolRecord {
  name?: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FabricAgentRecord {
  agent_id?: string;
  id?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
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

async function requestJson<T>(
  url: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token?.trim()) {
    headers.set("Authorization", `Bearer ${token.trim()}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed (${response.status})`));
  }

  return payload as T;
}

export async function verifyFabricAuth(
  baseUrl: string,
  token: string,
): Promise<FabricAuthVerifyResponse> {
  return requestJson<FabricAuthVerifyResponse>(
    `${normalizeBaseUrl(baseUrl)}/admin/verify`,
    token,
  );
}

export async function getFabricHealth(baseUrl: string): Promise<unknown> {
  return requestJson<unknown>(`${normalizeBaseUrl(baseUrl)}/mcp/health`);
}

export async function listFabricTools(
  baseUrl: string,
  token: string,
): Promise<FabricToolRecord[]> {
  return requestJson<FabricToolRecord[]>(
    `${normalizeBaseUrl(baseUrl)}/mcp/list_tools`,
    token,
  );
}

export async function listFabricAgents(
  baseUrl: string,
  token: string,
): Promise<FabricAgentRecord[]> {
  return requestJson<FabricAgentRecord[]>(
    `${normalizeBaseUrl(baseUrl)}/mcp/list_agents`,
    token,
  );
}

export async function listFabricTopics(
  baseUrl: string,
  token: string,
): Promise<unknown> {
  return requestJson<unknown>(
    `${normalizeBaseUrl(baseUrl)}/mcp/list_topics`,
    token,
  );
}

export async function getFabricAgent(
  baseUrl: string,
  token: string,
  agentId: string,
): Promise<unknown> {
  return requestJson<unknown>(
    `${normalizeBaseUrl(baseUrl)}/mcp/agent/${encodeURIComponent(agentId)}`,
    token,
  );
}

export async function callFabricMcp(
  baseUrl: string,
  token: string,
  payload: MCPRequest | Record<string, unknown>,
): Promise<MCPResponse | Record<string, unknown>> {
  return requestJson<MCPResponse | Record<string, unknown>>(
    `${normalizeBaseUrl(baseUrl)}/mcp/call`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
