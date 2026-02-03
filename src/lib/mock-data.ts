import type { 
  MCPTool, 
  Agent, 
  AgentNode, 
  AgentEdge, 
  EventEnvelope, 
  AsyncOperation,
  Tenant,
  ConsoleMessage,
  ShredderStatus 
} from '@/types/mcp';

export const mockTools: MCPTool[] = [
  {
    id: 'tool-1',
    name: 'filesystem.read',
    description: 'Read file contents from the local filesystem',
    version: '1.0.0',
    category: 'tool',
    tags: ['fs', 'io', 'read'],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to file' },
        encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
      },
      required: ['path']
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        size: { type: 'number' },
        mtime: { type: 'string' }
      }
    }
  },
  {
    id: 'tool-2',
    name: 'filesystem.write',
    description: 'Write content to a file on the local filesystem',
    version: '1.0.0',
    category: 'tool',
    tags: ['fs', 'io', 'write'],
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to file' },
        content: { type: 'string' },
        encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
      },
      required: ['path', 'content']
    }
  },
  {
    id: 'tool-3',
    name: 'database.query',
    description: 'Execute SQL query against connected database',
    version: '2.1.0',
    category: 'tool',
    tags: ['db', 'sql', 'query'],
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL query to execute' },
        params: { type: 'array', items: { type: 'string' } },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['sql']
    }
  },
  {
    id: 'tool-4',
    name: 'http.request',
    description: 'Make HTTP requests to external APIs',
    version: '1.2.0',
    category: 'tool',
    tags: ['http', 'api', 'network'],
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
        url: { type: 'string' },
        headers: { type: 'object' },
        body: { type: 'string' },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['method', 'url']
    }
  },
  {
    id: 'tool-5',
    name: 'llm.generate',
    description: 'Generate text using configured LLM provider',
    version: '3.0.0',
    category: 'tool',
    tags: ['ai', 'llm', 'generation'],
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        model: { type: 'string', default: 'gpt-4' },
        temperature: { type: 'number', default: 0.7 },
        max_tokens: { type: 'number', default: 2000 },
        stream: { type: 'boolean', default: false }
      },
      required: ['prompt']
    }
  },
  {
    id: 'tool-6',
    name: 'vector.search',
    description: 'Search vector database for similar embeddings',
    version: '1.5.0',
    category: 'tool',
    tags: ['vector', 'search', 'embedding'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        collection: { type: 'string' },
        top_k: { type: 'number', default: 10 },
        filter: { type: 'object' }
      },
      required: ['query', 'collection']
    }
  },
  {
    id: 'tool-7',
    name: 'cache.get',
    description: 'Retrieve value from distributed cache',
    version: '1.0.0',
    category: 'resource',
    tags: ['cache', 'redis', 'kv'],
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' }
      },
      required: ['key']
    }
  },
  {
    id: 'tool-8',
    name: 'prompt.code-review',
    description: 'Structured prompt for code review tasks',
    version: '1.0.0',
    category: 'prompt',
    tags: ['prompt', 'code', 'review'],
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        language: { type: 'string' },
        focus_areas: { type: 'array', items: { type: 'string' } }
      },
      required: ['code', 'language']
    }
  }
];

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'orchestrator-alpha',
    type: 'orchestrator',
    status: 'online',
    tenant_id: 'tenant-1',
    capabilities: ['routing', 'scheduling', 'monitoring'],
    last_seen: new Date().toISOString()
  },
  {
    id: 'agent-2',
    name: 'worker-beta-1',
    type: 'worker',
    status: 'busy',
    tenant_id: 'tenant-1',
    capabilities: ['compute', 'io', 'llm'],
    last_seen: new Date().toISOString()
  },
  {
    id: 'agent-3',
    name: 'worker-beta-2',
    type: 'worker',
    status: 'online',
    tenant_id: 'tenant-1',
    capabilities: ['compute', 'io', 'database'],
    last_seen: new Date().toISOString()
  },
  {
    id: 'agent-4',
    name: 'gateway-public',
    type: 'gateway',
    status: 'online',
    tenant_id: 'tenant-1',
    capabilities: ['http', 'auth', 'rate-limiting'],
    last_seen: new Date().toISOString()
  },
  {
    id: 'agent-5',
    name: 'orchestrator-gamma',
    type: 'orchestrator',
    status: 'online',
    tenant_id: 'tenant-2',
    capabilities: ['routing', 'scheduling'],
    last_seen: new Date().toISOString()
  },
  {
    id: 'agent-6',
    name: 'worker-delta',
    type: 'worker',
    status: 'offline',
    tenant_id: 'tenant-2',
    capabilities: ['compute', 'io'],
    last_seen: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'agent-7',
    name: 'observer-main',
    type: 'observer',
    status: 'online',
    tenant_id: 'tenant-1',
    capabilities: ['metrics', 'logging', 'tracing'],
    last_seen: new Date().toISOString()
  }
];

export const mockAgentNodes: AgentNode[] = mockAgents.map(agent => ({
  id: agent.id,
  name: agent.name,
  type: agent.type,
  status: agent.status
}));

export const mockAgentEdges: AgentEdge[] = [
  { id: 'edge-1', source: 'agent-1', target: 'agent-2', message_count: 156, last_message: new Date().toISOString() },
  { id: 'edge-2', source: 'agent-1', target: 'agent-3', message_count: 89, last_message: new Date().toISOString() },
  { id: 'edge-3', source: 'agent-4', target: 'agent-1', message_count: 234, last_message: new Date().toISOString() },
  { id: 'edge-4', source: 'agent-2', target: 'agent-7', message_count: 45, last_message: new Date().toISOString() },
  { id: 'edge-5', source: 'agent-3', target: 'agent-7', message_count: 32, last_message: new Date().toISOString() },
  { id: 'edge-6', source: 'agent-5', target: 'agent-6', message_count: 12, last_message: new Date(Date.now() - 3600000).toISOString() },
  { id: 'edge-7', source: 'agent-1', target: 'agent-7', message_count: 78, last_message: new Date().toISOString() }
];

export const mockTenants: Tenant[] = [
  { id: 'tenant-1', name: 'Production', color: '#10b981', agent_count: 5, message_count: 15600 },
  { id: 'tenant-2', name: 'Staging', color: '#f59e0b', agent_count: 2, message_count: 3400 },
  { id: 'tenant-3', name: 'Development', color: '#06b6d4', agent_count: 3, message_count: 8900 }
];

export const mockShredderStatus: ShredderStatus = {
  enabled: true,
  retention_days: 30,
  last_run: new Date(Date.now() - 86400000).toISOString(),
  pending_deletions: 127
};

export const generateMockEvents = (count: number = 20): EventEnvelope[] => {
  const events: EventEnvelope[] = [];
  const eventTypes: EventEnvelope['event_type'][] = ['request', 'response', 'event', 'error'];
  const statuses: EventEnvelope['status'][] = ['pending', 'streaming', 'completed', 'error'];
  
  for (let i = 0; i < count; i++) {
    const agent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
    events.push({
      tenant_id: agent.tenant_id,
      trace_id: `trace-${Math.random().toString(36).substr(2, 9)}`,
      causality_vector: { [agent.id]: i + 1 },
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      payload: { message: `Event ${i + 1}`, data: Math.random() },
      agent_id: agent.id,
      operation_id: `op-${Math.random().toString(36).substr(2, 9)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }
  
  return events;
};

export const generateMockOperations = (count: number = 10): AsyncOperation[] => {
  const operations: AsyncOperation[] = [];
  const statuses: AsyncOperation['status'][] = ['pending', 'streaming', 'completed', 'error'];
  
  for (let i = 0; i < count; i++) {
    const agent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    operations.push({
      id: `op-${Math.random().toString(36).substr(2, 9)}`,
      type: mockTools[Math.floor(Math.random() * mockTools.length)].name,
      status,
      progress: status === 'completed' ? 100 : status === 'pending' ? 0 : Math.floor(Math.random() * 100),
      created_at: new Date(Date.now() - i * 120000).toISOString(),
      updated_at: new Date(Date.now() - i * 60000).toISOString(),
      agent_id: agent.id,
      tenant_id: agent.tenant_id,
      request: {
        jsonrpc: '2.0',
        id: `req-${i}`,
        method: 'tools/call',
        params: { name: 'example', args: {} }
      },
      response: status === 'completed' || status === 'streaming' ? {
        jsonrpc: '2.0',
        id: `req-${i}`,
        result: { success: true }
      } : undefined,
      error: status === 'error' ? 'Operation failed: timeout' : undefined
    });
  }
  
  return operations;
};

export const generateMockConsoleMessages = (count: number = 50): ConsoleMessage[] => {
  const messages: ConsoleMessage[] = [];
  const levels: ConsoleMessage['level'][] = ['info', 'warn', 'error', 'debug'];
  const sampleMessages = [
    'Agent connected successfully',
    'Processing request batch',
    'Cache hit for key: user:1234',
    'Database query executed in 45ms',
    'LLM response received',
    'Rate limit applied',
    'Message queued for delivery',
    'Operation completed',
    'Retry attempt 2 of 3',
    'Connection established'
  ];
  
  for (let i = 0; i < count; i++) {
    const agent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
    messages.push({
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      agent_id: agent.id,
      tenant_id: agent.tenant_id,
      level: levels[Math.floor(Math.random() * levels.length)],
      message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
      metadata: { trace_id: `trace-${i}` }
    });
  }
  
  return messages;
};

export const statsData = {
  totalAgents: 42,
  totalMessages: 156789,
  activeOperations: 23,
  avgLatency: 45
};
