import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AsyncQueue } from "@/components/custom/AsyncQueue";
import { getDefaultBaseUrl } from "@/lib/fabric-admin-api";
import {
  callFabricMcp,
  getFabricAgent,
  getFabricHealth,
  listFabricAgents,
  listFabricTools,
  listFabricTopics,
  verifyFabricAuth,
  type FabricAgentRecord,
  type FabricAuthVerifyResponse,
  type FabricToolRecord,
} from "@/lib/fabric-mcp-api";
import {
  loadFabricSession,
  persistBaseUrl,
  persistOperatorKey,
} from "@/lib/fabric-session";
import { mockTools } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { AsyncOperation, MCPRequest } from "@/types/mcp";

type FabricCallPayload = MCPRequest | Record<string, unknown>;

const defaultRequest: FabricCallPayload = {
  name: "fabric.tool.math.calculate",
  arguments: {
    expression: "2 + 2",
  },
};

const requestTemplates: Array<{ name: string; value: FabricCallPayload }> = [
  { name: "Tool Call", value: defaultRequest },
  {
    name: "Math Smoke Test",
    value: {
      name: "fabric.tool.math.calculate",
      arguments: {
        expression: "2 + 2",
      },
    },
  },
  {
    name: "Message Send",
    value: {
      name: "fabric.message.send",
      arguments: {
        to_agent: "percy",
        from_agent: "orchestrator",
        message_type: "task",
        payload: {
          task_type: "health_check",
          note: "operator-ui smoke test",
        },
        priority: "normal",
      },
    },
  },
  {
    name: "Queue Status",
    value: {
      name: "fabric.message.queue_status",
      arguments: {
        agent_id: "percy",
      },
    },
  },
];

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function extractArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as T[];
    }
  }

  return [];
}

function toolName(tool: FabricToolRecord): string {
  if (typeof tool.name === "string" && tool.name) {
    return tool.name;
  }

  if (typeof tool.id === "string" && tool.id) {
    return tool.id;
  }

  return "unknown-tool";
}

function agentName(agent: FabricAgentRecord): string {
  if (typeof agent.name === "string" && agent.name) {
    return agent.name;
  }

  if (typeof agent.agent_id === "string" && agent.agent_id) {
    return agent.agent_id;
  }

  if (typeof agent.id === "string" && agent.id) {
    return agent.id;
  }

  return "unknown-agent";
}

function agentId(agent: FabricAgentRecord): string {
  return (agent.agent_id || agent.id || agent.name || "").toString();
}

export function Playground() {
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get("tool");

  const [request, setRequest] = useState(stringifyJson(defaultRequest));
  const [response, setResponse] = useState("");
  const [operations, setOperations] = useState<AsyncOperation[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Tool Call");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("request");

  const [baseUrl, setBaseUrl] = useState(getDefaultBaseUrl());
  const [accessKey, setAccessKey] = useState("");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [verifyResult, setVerifyResult] = useState<FabricAuthVerifyResponse | null>(null);
  const [health, setHealth] = useState<unknown>(null);
  const [tools, setTools] = useState<FabricToolRecord[]>([]);
  const [agents, setAgents] = useState<FabricAgentRecord[]>([]);
  const [topics, setTopics] = useState<unknown>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);

  useEffect(() => {
    const savedSession = loadFabricSession(getDefaultBaseUrl());
    setBaseUrl(savedSession.baseUrl);
    setAccessKey(savedSession.operatorKey || savedSession.adminKey);
  }, []);

  useEffect(() => {
    if (!toolId) {
      return;
    }

    const tool = mockTools.find((item) => item.id === toolId);
    if (!tool) {
      return;
    }

    const template = {
      name: tool.name,
      arguments: tool.inputSchema.properties
        ? Object.keys(tool.inputSchema.properties).reduce((acc, key) => {
            acc[key] = "";
            return acc;
          }, {} as Record<string, string>)
        : {},
    };

    setRequest(stringifyJson(template));
    setSelectedTemplate("Tool Call");
  }, [toolId]);

  const hasAuthInput = useMemo(
    () => Boolean(baseUrl.trim() && accessKey.trim()),
    [accessKey, baseUrl],
  );

  function persistConnectionSettings() {
    persistBaseUrl(baseUrl);
    persistOperatorKey(accessKey || null);
    setNotice("Operator connection saved for this browser session.");
  }

  function handleTemplateChange(templateName: string) {
    const template = requestTemplates.find((item) => item.name === templateName);
    if (!template) {
      return;
    }

    setRequest(stringifyJson(template.value));
    setSelectedTemplate(templateName);
    setActiveTab("request");
  }

  function pushOperation(operation: AsyncOperation) {
    setOperations((prev) => [operation, ...prev].slice(0, 25));
  }

  function updateOperation(id: string, patch: Partial<AsyncOperation>) {
    setOperations((prev) =>
      prev.map((operation) =>
        operation.id === id
          ? { ...operation, ...patch, updated_at: new Date().toISOString() }
          : operation,
      ),
    );
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatRequest() {
    try {
      setRequest(stringifyJson(JSON.parse(request)));
    } catch {
      setError("Request body is not valid JSON.");
    }
  }

  async function runWithOperation(
    type: string,
    runner: () => Promise<unknown>,
    agentIdValue = "control-plane",
  ) {
    if (!hasAuthInput && type !== "health") {
      setError("Set Fabric API Base URL and a valid key first.");
      return null;
    }

    const operationId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    pushOperation({
      id: operationId,
      type,
      status: "pending",
      progress: 10,
      created_at: createdAt,
      updated_at: createdAt,
      agent_id: agentIdValue,
      tenant_id: verifyResult?.owner_id || "fabric",
      request: { jsonrpc: "2.0", id: operationId, method: type },
    });

    try {
      const result = await runner();
      updateOperation(operationId, {
        status: "completed",
        progress: 100,
        response: { jsonrpc: "2.0", id: operationId, result },
      });
      return result;
    } catch (err) {
      updateOperation(operationId, {
        status: "error",
        progress: 100,
        error: err instanceof Error ? err.message : `${type} failed`,
      });
      throw err;
    }
  }

  async function runVerify() {
    if (!hasAuthInput) {
      setError("Set Fabric API Base URL and a valid key first.");
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const result = (await runWithOperation("admin/verify", () =>
        verifyFabricAuth(baseUrl, accessKey.trim()),
      )) as FabricAuthVerifyResponse | null;
      if (!result) {
        return;
      }

      setVerifyResult(result);
      setNotice("Credential verified against /admin/verify.");
    } catch (err) {
      setVerifyResult(null);
      setError(err instanceof Error ? err.message : "Verify request failed.");
    }
  }

  async function loadHealth() {
    setError(null);
    setNotice(null);
    setIsLoadingHealth(true);

    try {
      const result = await runWithOperation("mcp/health", () => getFabricHealth(baseUrl));
      setHealth(result);
      setResponse(stringifyJson(result));
      setActiveTab("response");
      setNotice("Loaded live MCP health.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health request failed.");
    } finally {
      setIsLoadingHealth(false);
    }
  }

  async function loadTools() {
    setError(null);
    setNotice(null);
    setIsLoadingTools(true);

    try {
      const result = await runWithOperation("mcp/list_tools", () =>
        listFabricTools(baseUrl, accessKey.trim()),
      );
      const toolList = extractArray<FabricToolRecord>(result, ["tools", "items"]);
      setTools(toolList);
      setResponse(stringifyJson(result));
      setActiveTab("response");
      setNotice(`Loaded ${toolList.length} tool record(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "List tools failed.");
    } finally {
      setIsLoadingTools(false);
    }
  }

  async function loadAgents() {
    setError(null);
    setNotice(null);
    setIsLoadingAgents(true);

    try {
      const result = await runWithOperation("mcp/list_agents", () =>
        listFabricAgents(baseUrl, accessKey.trim()),
      );
      const agentList = extractArray<FabricAgentRecord>(result, ["agents", "items"]);
      setAgents(agentList);
      if (!selectedAgentId && agentList[0]) {
        setSelectedAgentId(agentId(agentList[0]));
      }
      setResponse(stringifyJson(result));
      setActiveTab("response");
      setNotice(`Loaded ${agentList.length} agent record(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "List agents failed.");
    } finally {
      setIsLoadingAgents(false);
    }
  }

  async function loadTopics() {
    setError(null);
    setNotice(null);
    setIsLoadingTopics(true);

    try {
      const result = await runWithOperation("mcp/list_topics", () =>
        listFabricTopics(baseUrl, accessKey.trim()),
      );
      setTopics(result);
      setResponse(stringifyJson(result));
      setActiveTab("response");
      setNotice("Loaded live topic data.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "List topics failed.");
    } finally {
      setIsLoadingTopics(false);
    }
  }

  async function loadAgentDetails() {
    if (!selectedAgentId.trim()) {
      setError("Choose an agent first.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsLoadingAgent(true);

    try {
      const result = await runWithOperation(
        `mcp/agent/${selectedAgentId}`,
        () => getFabricAgent(baseUrl, accessKey.trim(), selectedAgentId.trim()),
        selectedAgentId.trim(),
      );
      setResponse(stringifyJson(result));
      setActiveTab("response");
      setNotice(`Loaded agent detail for ${selectedAgentId}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent detail request failed.");
    } finally {
      setIsLoadingAgent(false);
    }
  }

  async function handleExecute() {
    if (!hasAuthInput) {
      setError("Set Fabric API Base URL and a valid key first.");
      return;
    }

    let parsedRequest: FabricCallPayload;
    try {
      parsedRequest = JSON.parse(request) as FabricCallPayload;
    } catch {
      setError("Request body is not valid JSON.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsExecuting(true);
    setActiveTab("queue");

    const operationId = `op-${Date.now()}`;
    const createdAt = new Date().toISOString();

    pushOperation({
      id: operationId,
      type: "mcp/call",
      status: "streaming",
      progress: 35,
      created_at: createdAt,
      updated_at: createdAt,
      agent_id:
        typeof parsedRequest === "object" &&
        parsedRequest &&
        "name" in parsedRequest &&
        typeof parsedRequest.name === "string"
          ? parsedRequest.name
          : "mcp/call",
      tenant_id: verifyResult?.owner_id || "fabric",
      request: {
        jsonrpc: "2.0",
        id: operationId,
        method: "mcp/call",
        params: parsedRequest as Record<string, unknown>,
      },
    });

    try {
      const result = await callFabricMcp(baseUrl, accessKey.trim(), parsedRequest);
      updateOperation(operationId, {
        status: "completed",
        progress: 100,
        response: {
          jsonrpc: "2.0",
          id: operationId,
          result,
        },
      });
      setResponse(stringifyJson(result));
      setActiveTab("response");
      setNotice("Live MCP call completed.");
    } catch (err) {
      updateOperation(operationId, {
        status: "error",
        progress: 100,
        error: err instanceof Error ? err.message : "MCP call failed",
      });
      setError(err instanceof Error ? err.message : "MCP call failed.");
    } finally {
      setIsExecuting(false);
    }
  }

  function handleCancel(id: string) {
    updateOperation(id, {
      status: "error",
      progress: 100,
      error: "Marked cancelled in UI. Backend cancellation is not yet wired.",
    });
  }

  const liveToolCount = tools.length;
  const liveAgentCount = agents.length;
  const topicCount = useMemo(() => {
    if (Array.isArray(topics)) {
      return topics.length;
    }
    if (topics && typeof topics === "object") {
      const record = topics as Record<string, unknown>;
      if (Array.isArray(record.topics)) {
        return record.topics.length;
      }
    }
    return 0;
  }, [topics]);

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Operator Playground</h1>
                <p className="text-xs text-zinc-500">
                  Live Fabric control surface for key verification, discovery, tool calls, and agent message operations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 border border-zinc-800">
                tools {liveToolCount}
              </Badge>
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 border border-zinc-800">
                agents {liveAgentCount}
              </Badge>
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 border border-zinc-800">
                topics {topicCount}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-140px)]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-0 h-full">
          <div className="flex flex-col border-r border-zinc-800">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                  <TabsTrigger value="request" className="data-[state=active]:bg-zinc-800">
                    Request
                  </TabsTrigger>
                  <TabsTrigger value="response" className="data-[state=active]:bg-zinc-800">
                    Response
                  </TabsTrigger>
                  <TabsTrigger value="queue" className="data-[state=active]:bg-zinc-800">
                    Queue
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {requestTemplates.map((template) => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" size="sm" onClick={formatRequest}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(activeTab === "request" ? request : response)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRequest(stringifyJson(defaultRequest))}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="request" className="h-[calc(100%-60px)] mt-0">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={request}
                  onChange={(value) => setRequest(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "JetBrains Mono, monospace",
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </TabsContent>

              <TabsContent value="response" className="h-[calc(100%-60px)] mt-0">
                {response ? (
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={response}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "JetBrains Mono, monospace",
                      lineNumbers: "on",
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: true,
                      automaticLayout: true,
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                      <p className="text-zinc-500">Run a live Fabric tool or agent action to see the response.</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="queue" className="h-[calc(100%-60px)] mt-0 p-4">
                <AsyncQueue operations={operations} onCancel={handleCancel} />
              </TabsContent>
            </Tabs>

            <div className="p-4 border-t border-zinc-800 space-y-3">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-300">
                  {notice}
                </div>
              )}
              <Button
                onClick={handleExecute}
                disabled={isExecuting || !hasAuthInput}
                className="w-full bg-purple-600 hover:bg-purple-500 h-12"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Execute Live Call
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col bg-zinc-950/50">
            <div className="p-4 border-b border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm font-medium text-zinc-300">Live Connection</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fabric-base-url">Fabric API Base URL</Label>
                <Input
                  id="fabric-base-url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://fabric.perceptor.us"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fabric-access-key">Operator / Client Key</Label>
                <div className="relative">
                  <Input
                    id="fabric-access-key"
                    type={showAccessKey ? "text" : "password"}
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="fab_sk_live_... or admin key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessKey((value) => !value)}
                    className="absolute inset-y-0 right-0 px-3 text-zinc-500 hover:text-zinc-300"
                    aria-label="Toggle key visibility"
                  >
                    {showAccessKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  With only the admin key available, use it here to bootstrap live discovery and test newly minted scoped keys.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={runVerify} disabled={!hasAuthInput}>
                  Verify
                </Button>
                <Button variant="outline" onClick={persistConnectionSettings}>
                  Save
                </Button>
              </div>

              {verifyResult && (
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-sm">
                  <div className="text-teal-300 font-medium">Verified</div>
                  <div className="text-zinc-300 mt-1">
                    method={verifyResult.method || "unknown"} scope={verifyResult.scope || "n/a"}
                  </div>
                  {verifyResult.owner_id && (
                    <div className="text-zinc-400 text-xs mt-1">owner={verifyResult.owner_id}</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={loadHealth} disabled={isLoadingHealth}>
                  {isLoadingHealth ? "Loading..." : "Health"}
                </Button>
                <Button variant="secondary" onClick={loadTools} disabled={!hasAuthInput || isLoadingTools}>
                  {isLoadingTools ? "Loading..." : "List Tools"}
                </Button>
                <Button variant="secondary" onClick={loadAgents} disabled={!hasAuthInput || isLoadingAgents}>
                  {isLoadingAgents ? "Loading..." : "List Agents"}
                </Button>
                <Button variant="secondary" onClick={loadTopics} disabled={!hasAuthInput || isLoadingTopics}>
                  {isLoadingTopics ? "Loading..." : "List Topics"}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-select">Agent Detail</Label>
                <div className="flex gap-2">
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300">
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {agents.map((agent) => (
                        <SelectItem key={agentId(agent)} value={agentId(agent)}>
                          {agentName(agent)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={loadAgentDetails}
                    disabled={!hasAuthInput || !selectedAgentId || isLoadingAgent}
                  >
                    {isLoadingAgent ? "..." : "Load"}
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Live Tools</h3>
                  <div className="space-y-3">
                    {tools.length === 0 ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
                        Load `/mcp/list_tools` to populate this panel.
                      </div>
                    ) : (
                      tools.map((tool) => (
                        <button
                          key={toolName(tool)}
                          type="button"
                          className={cn(
                            "w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left transition-colors hover:border-purple-500/50",
                          )}
                          onClick={() => {
                            setRequest(
                              stringifyJson({
                                name: toolName(tool),
                                arguments: {},
                              }),
                            );
                            setSelectedTemplate("Tool Call");
                            setActiveTab("request");
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-200">{toolName(tool)}</span>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                              live
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                            {typeof tool.description === "string" ? tool.description : "No description returned"}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Live Agents</h3>
                  <div className="space-y-3">
                    {agents.length === 0 ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
                        Load `/mcp/list_agents` to inspect registered agents.
                      </div>
                    ) : (
                      agents.map((agent) => (
                        <button
                          key={agentId(agent)}
                          type="button"
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left transition-colors hover:border-cyan-500/50"
                          onClick={() => setSelectedAgentId(agentId(agent))}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-200">{agentName(agent)}</span>
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                              {typeof agent.status === "string" ? agent.status : "unknown"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">{agentId(agent)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {Boolean(health) && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Last Health Snapshot</h3>
                    <pre className="text-xs text-zinc-500 whitespace-pre-wrap break-all">
                      {stringifyJson(health)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
