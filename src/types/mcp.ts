// MCP Protocol Types

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  description?: string;
  [key: string]: unknown;
}

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  version: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  category: 'tool' | 'resource' | 'prompt';
  tags: string[];
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface EventEnvelope {
  tenant_id: string;
  trace_id: string;
  causality_vector: Record<string, number>;
  timestamp: string;
  event_type: 'request' | 'response' | 'event' | 'error';
  payload: unknown;
  agent_id: string;
  operation_id: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
}

export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'worker' | 'gateway' | 'observer';
  status: 'online' | 'offline' | 'busy';
  tenant_id: string;
  capabilities: string[];
  last_seen: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  type: 'request' | 'response' | 'event';
  payload: unknown;
  timestamp: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  trace_id: string;
}

export interface AgentNode {
  id: string;
  name: string;
  type: Agent['type'];
  status: Agent['status'];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  message_count: number;
  last_message: string;
}

export interface AsyncOperation {
  id: string;
  type: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  progress: number;
  created_at: string;
  updated_at: string;
  agent_id: string;
  tenant_id: string;
  request: MCPRequest;
  response?: MCPResponse;
  error?: string;
}

export interface Tenant {
  id: string;
  name: string;
  color: string;
  agent_count: number;
  message_count: number;
}

export interface ShredderStatus {
  enabled: boolean;
  retention_days: number;
  last_run: string;
  pending_deletions: number;
}

export interface ConsoleMessage {
  id: string;
  timestamp: string;
  agent_id: string;
  tenant_id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}
