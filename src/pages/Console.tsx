import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Filter,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageStream } from "@/components/custom/MessageStream";
import { SchemaInspector } from "@/components/custom/SchemaInspector";
import { useAppStore } from "@/store/useAppStore";
import { getDefaultBaseUrl } from "@/lib/fabric-admin-api";
import {
  callFabricMcp,
  getFabricHealth,
  listFabricAgents,
  verifyFabricAuth,
  type FabricAgentRecord,
  type FabricAuthVerifyResponse,
} from "@/lib/fabric-mcp-api";
import { loadFabricSession, persistBaseUrl, persistOperatorKey } from "@/lib/fabric-session";
import type { ConsoleMessage, EventEnvelope } from "@/types/mcp";

const levelColors: Record<ConsoleMessage["level"], string> = {
  info: "text-cyan-400",
  warn: "text-amber-400",
  error: "text-red-400",
  debug: "text-zinc-400",
};

const levelBgColors: Record<ConsoleMessage["level"], string> = {
  info: "bg-cyan-500/10 border-cyan-500/30",
  warn: "bg-amber-500/10 border-amber-500/30",
  error: "bg-red-500/10 border-red-500/30",
  debug: "bg-zinc-500/10 border-zinc-500/30",
};

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

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractTraceId(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return createId("trace");
  }

  const record = payload as Record<string, unknown>;
  const trace = record.trace as Record<string, unknown> | undefined;
  return typeof trace?.trace_id === "string" ? trace.trace_id : createId("trace");
}

function extractQueueDepth(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.queue_depth === "number") {
    return record.queue_depth;
  }

  const result = record.result as Record<string, unknown> | undefined;
  return typeof result?.queue_depth === "number" ? result.queue_depth : null;
}

function agentId(agent: FabricAgentRecord): string {
  return String(agent.agent_id || agent.id || agent.name || "");
}

function EventDetails({ event }: { event: EventEnvelope }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">Event Details</h3>
          <p className="text-xs text-zinc-500">{event.trace_id}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Event Type</span>
              <div className="text-sm text-zinc-300 capitalize">{event.event_type}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Status</span>
              <Badge
                variant="secondary"
                className={cn(
                  event.status === "completed" && "bg-teal-500/10 text-teal-400",
                  event.status === "pending" && "bg-amber-500/10 text-amber-400",
                  event.status === "streaming" && "bg-cyan-500/10 text-cyan-400",
                  event.status === "error" && "bg-red-500/10 text-red-400",
                )}
              >
                {event.status}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Agent</span>
              <div className="text-sm text-zinc-300 font-mono">{event.agent_id}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-xs text-zinc-500">Owner / Scope</span>
              <div className="text-sm text-zinc-300">{event.tenant_id}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-500">Timestamp</span>
            <div className="text-sm text-zinc-300">{new Date(event.timestamp).toLocaleString()}</div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Causality Vector</h4>
            <SchemaInspector schema={event.causality_vector} name="vector" />
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Payload</h4>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-sm">
              <pre className="text-zinc-300 overflow-auto">
                <code>{JSON.stringify(event.payload, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function Console() {
  const [events, setEvents] = useState<EventEnvelope[]>([]);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventEnvelope | null>(null);
  const [filter, setFilter] = useState<ConsoleMessage["level"] | "all">("all");
  const [baseUrl, setBaseUrl] = useState(getDefaultBaseUrl());
  const [accessKey, setAccessKey] = useState("");
  const [verifyResult, setVerifyResult] = useState<FabricAuthVerifyResponse | null>(null);
  const [agents, setAgents] = useState<FabricAgentRecord[]>([]);
  const [fromAgent, setFromAgent] = useState("orchestrator");
  const [toAgent, setToAgent] = useState("percy");
  const [messageType, setMessageType] = useState("task");
  const [payloadInput, setPayloadInput] = useState('{\n  "task_type": "health_check",\n  "note": "console operator test"\n}');
  const [queueAgentId, setQueueAgentId] = useState("percy");
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { autoScroll } = useAppStore();

  useEffect(() => {
    const session = loadFabricSession(getDefaultBaseUrl());
    setBaseUrl(session.baseUrl);
    setAccessKey(session.operatorKey || session.adminKey);
  }, []);

  const filteredMessages = consoleMessages.filter(
    (msg) => filter === "all" || msg.level === filter,
  );

  function appendEvent(event: EventEnvelope) {
    setEvents((prev) => [event, ...prev].slice(0, 200));
  }

  function appendLog(level: ConsoleMessage["level"], message: string, metadata?: Record<string, unknown>) {
    setConsoleMessages((prev) => [
      {
        id: createId("log"),
        timestamp: new Date().toISOString(),
        agent_id: fromAgent,
        tenant_id: verifyResult?.owner_id || "fabric",
        level,
        message,
        metadata,
      },
      ...prev,
    ].slice(0, 300));
  }

  function pushRequestEvent(operationId: string, agentIdValue: string, payload: unknown): EventEnvelope {
    const event: EventEnvelope = {
      tenant_id: verifyResult?.owner_id || "fabric",
      trace_id: createId("trace"),
      causality_vector: { [agentIdValue]: 1 },
      timestamp: new Date().toISOString(),
      event_type: "request",
      payload,
      agent_id: agentIdValue,
      operation_id: operationId,
      status: "pending",
    };
    appendEvent(event);
    return event;
  }

  function pushResultEvent(
    requestEvent: EventEnvelope,
    status: EventEnvelope["status"],
    payload: unknown,
    eventType: EventEnvelope["event_type"] = "response",
  ) {
    appendEvent({
      ...requestEvent,
      trace_id: extractTraceId(payload),
      timestamp: new Date().toISOString(),
      event_type: eventType,
      payload,
      status,
    });
  }

  async function runAction(label: string, agentIdValue: string, payload: unknown, runner: () => Promise<unknown>) {
    if (!baseUrl.trim() || !accessKey.trim()) {
      setError("Set a valid Fabric base URL and API key first.");
      return null;
    }

    setError(null);
    setNotice(null);
    setIsWorking(true);
    persistBaseUrl(baseUrl);
    persistOperatorKey(accessKey);

    const operationId = createId("op");
    const requestEvent = pushRequestEvent(operationId, agentIdValue, payload);
    appendLog("info", `${label} started`, { operation_id: operationId, agent_id: agentIdValue });

    try {
      const result = await runner();
      pushResultEvent(requestEvent, "completed", result, "response");
      appendLog("info", `${label} completed`, { operation_id: operationId, result });
      setSelectedEvent(requestEvent);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : `${label} failed`;
      pushResultEvent(requestEvent, "error", { message }, "error");
      appendLog("error", `${label} failed`, { operation_id: operationId, error: message });
      setError(message);
      return null;
    } finally {
      setIsWorking(false);
    }
  }

  async function verifyKey() {
    const result = await runAction(
      "verify key",
      "auth",
      { endpoint: "/admin/verify" },
      () => verifyFabricAuth(baseUrl, accessKey.trim()),
    );

    if (result) {
      const verify = result as FabricAuthVerifyResponse;
      setVerifyResult(verify);
      setNotice(`Verified ${verify.method} scope=${verify.scope || "n/a"}`);
    }
  }

  async function loadHealth() {
    const result = await runAction(
      "load health",
      "health",
      { endpoint: "/mcp/health" },
      () => getFabricHealth(baseUrl),
    );

    if (result) {
      setNotice("Loaded live backend health.");
    }
  }

  async function loadAgents() {
    const result = await runAction(
      "list agents",
      "registry",
      { endpoint: "/mcp/list_agents" },
      () => listFabricAgents(baseUrl, accessKey.trim()),
    );

    if (result) {
      const agentList = extractArray<FabricAgentRecord>(result, ["agents", "items"]);
      setAgents(agentList);
      if (agentList[0]) {
        const firstAgent = agentId(agentList[0]);
        setToAgent((current) => current || firstAgent);
        setQueueAgentId((current) => current || firstAgent);
      }
      setNotice(`Loaded ${agentList.length} live agent records.`);
    }
  }

  async function sendMessage() {
    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payloadInput) as Record<string, unknown>;
    } catch {
      setError("Message payload must be valid JSON.");
      appendLog("error", "message payload parse failed");
      return;
    }

    const payload = {
      name: "fabric.message.send",
      arguments: {
        to_agent: toAgent.trim(),
        from_agent: fromAgent.trim(),
        message_type: messageType.trim(),
        payload: parsedPayload,
        priority: "normal",
      },
    };

    const result = await runAction(
      "send message",
      toAgent.trim() || "message-bus",
      payload,
      () => callFabricMcp(baseUrl, accessKey.trim(), payload),
    );

    if (result) {
      setNotice(`Queued message for ${toAgent.trim()}.`);
    }
  }

  async function checkQueue() {
    const payload = {
      name: "fabric.message.queue_status",
      arguments: {
        agent_id: queueAgentId.trim(),
      },
    };

    const result = await runAction(
      "queue status",
      queueAgentId.trim() || "message-bus",
      payload,
      () => callFabricMcp(baseUrl, accessKey.trim(), payload),
    );

    if (result) {
      const depth = extractQueueDepth(result);
      setNotice(
        depth === null
          ? `Loaded queue status for ${queueAgentId.trim()}.`
          : `Queue depth for ${queueAgentId.trim()}: ${depth}`,
      );
    }
  }

  function clearConsole() {
    setEvents([]);
    setConsoleMessages([]);
    setSelectedEvent(null);
    setNotice("Cleared local console history.");
  }

  const agentOptions = useMemo(
    () => agents.map((agent) => agentId(agent)).filter(Boolean),
    [agents],
  );

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Console</h1>
                <p className="text-xs text-zinc-500">
                  Real operator activity only. No mock events, no simulated logs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 border border-zinc-800">
                events {events.length}
              </Badge>
              <Badge variant="secondary" className="bg-zinc-900 text-zinc-300 border border-zinc-800">
                logs {consoleMessages.length}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearConsole}
                className="text-zinc-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="console-base-url">Fabric API Base URL</Label>
                <Input id="console-base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="console-key">Operator / Client Key</Label>
                <Input
                  id="console-key"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="fab_sk_live_..."
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Button onClick={verifyKey} disabled={isWorking}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify
              </Button>
              <Button variant="secondary" onClick={loadHealth} disabled={isWorking}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Health
              </Button>
              <Button variant="secondary" onClick={loadAgents} disabled={isWorking}>
                Load Agents
              </Button>
            </div>
          </div>

          {(notice || error || verifyResult) && (
            <div className="flex flex-wrap gap-3 mt-4">
              {verifyResult && (
                <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-300">
                  verified: {verifyResult.method} / {verifyResult.scope || "n/a"} / {verifyResult.owner_id || "unknown"}
                </div>
              )}
              {notice && (
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300">
                  {notice}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-220px)]">
        <Tabs defaultValue="events" className="h-full">
          <div className="px-4 sm:px-6 lg:px-8 py-2 border-b border-zinc-800">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="events" className="data-[state=active]:bg-zinc-800">
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-800">
                Action Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="events" className="h-[calc(100%-50px)] mt-0">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] h-full">
              <div className="border-r border-zinc-800 p-4">
                <MessageStream
                  messages={events}
                  selectedId={selectedEvent?.trace_id}
                  onSelect={setSelectedEvent}
                  autoScroll={autoScroll}
                />
              </div>

              <div className="grid grid-rows-[auto_1fr] h-full">
                <div className="border-b border-zinc-800 p-4 space-y-4 bg-zinc-950/80">
                  <div>
                    <h2 className="text-sm font-medium text-zinc-200">Operator Controls</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Real backend actions only: send A2A messages and inspect queue depth.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="from-agent">From Agent</Label>
                      <Input id="from-agent" value={fromAgent} onChange={(e) => setFromAgent(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to-agent">To Agent</Label>
                      <Input id="to-agent" value={toAgent} onChange={(e) => setToAgent(e.target.value)} list="known-agents" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="message-type">Message Type</Label>
                      <Input id="message-type" value={messageType} onChange={(e) => setMessageType(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message-payload">Payload JSON</Label>
                    <Textarea
                      id="message-payload"
                      value={payloadInput}
                      onChange={(e) => setPayloadInput(e.target.value)}
                      className="min-h-28 font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={sendMessage} disabled={isWorking}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <div className="flex items-center gap-2">
                      <Input
                        value={queueAgentId}
                        onChange={(e) => setQueueAgentId(e.target.value)}
                        placeholder="agent_id"
                        list="known-agents"
                        className="w-36"
                      />
                      <Button variant="secondary" onClick={checkQueue} disabled={isWorking}>
                        Queue Status
                      </Button>
                    </div>
                  </div>

                  <datalist id="known-agents">
                    {agentOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>

                <div className="bg-zinc-950">
                  {selectedEvent ? (
                    <EventDetails event={selectedEvent} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Terminal className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500">Run a real console action to populate the feed.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="h-[calc(100%-50px)] mt-0 p-4">
            <div className="h-full bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Filter:</span>
                  <div className="flex items-center gap-1">
                    {(["all", "info", "warn", "error", "debug"] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={cn(
                          "px-2 py-1 text-xs rounded transition-colors",
                          filter === value ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300",
                        )}
                      >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{filteredMessages.length} real log entries</span>
              </div>

              <ScrollArea className="h-[calc(100%-60px)] p-4">
                {filteredMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                    No real operator logs yet.
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-sm">
                    {filteredMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 p-2 rounded hover:bg-zinc-900/50">
                        <span className="text-zinc-600 text-xs">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        <Badge variant="secondary" className={cn("text-xs capitalize", levelBgColors[msg.level])}>
                          {msg.level}
                        </Badge>
                        <span className="text-zinc-500 text-xs">{msg.agent_id}</span>
                        <span className={cn("flex-1", levelColors[msg.level])}>{msg.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
