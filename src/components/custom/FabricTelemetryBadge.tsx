import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Cpu, Loader2 } from "lucide-react";
import { getDefaultBaseUrl } from "@/lib/fabric-admin-api";
import { getFabricHealth } from "@/lib/fabric-mcp-api";
import { loadFabricSession } from "@/lib/fabric-session";
import { cn } from "@/lib/utils";
import { StatusIndicator } from "@/components/custom/StatusIndicator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FabricHealthSnapshot {
  tools?: Record<string, unknown>;
  agents?: {
    online?: number;
    offline?: number;
    degraded?: number;
  };
  queues?: Record<string, unknown>;
  uptime_seconds?: number;
  version?: string;
  [key: string]: unknown;
}

function formatUptime(seconds?: number): string {
  if (!seconds || seconds < 1) {
    return "uptime n/a";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return `${days}d ${hours}h uptime`;
  }

  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m uptime`;
}

export function FabricTelemetryBadge({ className }: { className?: string }) {
  const [health, setHealth] = useState<FabricHealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      const session = loadFabricSession(getDefaultBaseUrl());

      try {
        const result = (await getFabricHealth(session.baseUrl)) as FabricHealthSnapshot;
        if (cancelled) {
          return;
        }
        setHealth(result);
        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Health unavailable");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadHealth();
    const intervalId = window.setInterval(loadHealth, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const toolCount = useMemo(
    () => (health?.tools ? Object.keys(health.tools).length : 0),
    [health],
  );
  const onlineAgents = health?.agents?.online ?? 0;
  const degradedAgents = health?.agents?.degraded ?? 0;
  const isOnline = !error && health !== null;
  const status: "online" | "busy" | "error" = error
    ? "error"
    : isLoading
      ? "busy"
      : "online";

  const statusText = error
    ? "Telemetry unavailable"
    : isLoading
      ? "Loading telemetry"
      : `${onlineAgents} agents · ${toolCount} tools`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border",
              error && "border-red-500/40 bg-red-500/10 text-red-300",
              !error && isLoading && "border-amber-500/40 bg-amber-500/10 text-amber-300",
              isOnline && "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
              className,
            )}
          >
            {error ? (
              <AlertTriangle className="w-4 h-4" />
            ) : isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4" />
            )}
            <StatusIndicator status={status} size="sm" pulse={!error} />
            <span className="hidden sm:inline">{statusText}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-800 text-zinc-200">
          <div className="space-y-1 min-w-52">
            <p className="font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-300" />
              Fabric Telemetry
            </p>
            {error ? (
              <p className="text-xs text-red-300">{error}</p>
            ) : (
              <>
                <p className="text-xs text-zinc-400">online_agents: {onlineAgents}</p>
                <p className="text-xs text-zinc-400">degraded_agents: {degradedAgents}</p>
                <p className="text-xs text-zinc-400">tool_count: {toolCount}</p>
                <p className="text-xs text-zinc-400">{formatUptime(health?.uptime_seconds)}</p>
                {health?.version && (
                  <p className="text-xs text-zinc-400">version: {String(health.version)}</p>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
