import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  createKey,
  getDefaultBaseUrl,
  listKeys,
  revokeKey,
  verifyAdmin,
  type AdminVerifyResponse,
  type CreateKeyPayload,
  type CreateKeyResponse,
  type FabricKeySummary,
  type KeyScope,
} from "@/lib/fabric-admin-api";
import { cn } from "@/lib/utils";

const STORAGE_BASE_URL = "mcpfabric.api.base_url";
const STORAGE_ADMIN_KEY = "mcpfabric.api.admin_key";

const scopeOptions: Array<{ value: KeyScope; label: string; help: string }> = [
  { value: "full", label: "Full", help: "All Fabric tool + message operations." },
  {
    value: "tools_only",
    label: "Tools Only",
    help: "Can run tools, cannot do full agent operations.",
  },
  {
    value: "read_only",
    label: "Read Only",
    help: "List and inspect operations with minimal write access.",
  },
  { value: "admin", label: "Admin", help: "Can create/list/revoke API keys." },
];

function maskToken(token: string): string {
  if (token.length < 16) {
    return token;
  }
  return `${token.slice(0, 12)}...${token.slice(-6)}`;
}

export function ApiKeys() {
  const [baseUrl, setBaseUrl] = useState(getDefaultBaseUrl());
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [rememberAdminKey, setRememberAdminKey] = useState(false);

  const [verifyResult, setVerifyResult] = useState<AdminVerifyResponse | null>(null);
  const [keys, setKeys] = useState<FabricKeySummary[]>([]);
  const [latestCreated, setLatestCreated] = useState<CreateKeyResponse | null>(null);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<CreateKeyPayload>({
    name: "mcpfabric-ui-key",
    owner_id: "mcpfabric-tenant",
    scope: "full",
    expires_in_days: 365,
    rate_limit_rpm: 600,
    test: false,
    allowed_agents: [],
    metadata: {
      created_from: "mcpfabric-ui",
    },
  });

  useEffect(() => {
    const savedBaseUrl = localStorage.getItem(STORAGE_BASE_URL);
    const savedAdminKey = sessionStorage.getItem(STORAGE_ADMIN_KEY);

    if (savedBaseUrl) {
      setBaseUrl(savedBaseUrl);
    }

    if (savedAdminKey) {
      setAdminKey(savedAdminKey);
      setRememberAdminKey(true);
    }
  }, []);

  const hasAdminInput = useMemo(
    () => Boolean(baseUrl.trim() && adminKey.trim()),
    [baseUrl, adminKey],
  );

  async function runVerify() {
    if (!hasAdminInput) {
      setError("Set API Base URL and Admin Key first.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsVerifying(true);

    try {
      const result = await verifyAdmin(baseUrl, adminKey.trim());
      setVerifyResult(result);
      setNotice("Admin verification passed.");
    } catch (err) {
      setVerifyResult(null);
      setError(err instanceof Error ? err.message : "Verify request failed.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function runListKeys() {
    if (!hasAdminInput) {
      setError("Set API Base URL and Admin Key first.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsLoadingKeys(true);

    try {
      const result = await listKeys(baseUrl, adminKey.trim());
      setKeys(result);
      setNotice(`Loaded ${result.length} key(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "List keys request failed.");
    } finally {
      setIsLoadingKeys(false);
    }
  }

  async function runCreateKey() {
    if (!hasAdminInput) {
      setError("Set API Base URL and Admin Key first.");
      return;
    }
    if (!form.name.trim() || !form.owner_id.trim()) {
      setError("Name and Owner ID are required.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsCreating(true);

    try {
      const payload: CreateKeyPayload = {
        ...form,
        name: form.name.trim(),
        owner_id: form.owner_id.trim(),
        expires_in_days: form.expires_in_days || null,
      };
      const result = await createKey(baseUrl, adminKey.trim(), payload);
      setLatestCreated(result);
      setNotice("API key created. Save it now; raw key is shown once.");
      await runListKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create key request failed.");
    } finally {
      setIsCreating(false);
    }
  }

  async function runRevokeKey(keyId: string) {
    if (!hasAdminInput) {
      setError("Set API Base URL and Admin Key first.");
      return;
    }

    setError(null);
    setNotice(null);
    setRevokingKeyId(keyId);

    try {
      await revokeKey(baseUrl, adminKey.trim(), keyId);
      setNotice("Key revoked.");
      await runListKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke request failed.");
    } finally {
      setRevokingKeyId(null);
    }
  }

  function persistConnectionSettings() {
    localStorage.setItem(STORAGE_BASE_URL, baseUrl.trim());
    if (rememberAdminKey) {
      sessionStorage.setItem(STORAGE_ADMIN_KEY, adminKey.trim());
    } else {
      sessionStorage.removeItem(STORAGE_ADMIN_KEY);
    }
    setNotice("Connection settings saved for this browser.");
  }

  async function copyLatestKey() {
    if (!latestCreated?.key) {
      return;
    }
    await navigator.clipboard.writeText(latestCreated.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="min-h-screen bg-zinc-950 pt-16 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-8 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <KeyRound className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">API Keys</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Admin-only key management. This page calls live backend endpoints:
                <span className="text-zinc-300 font-mono"> /admin/verify </span>
                <span className="text-zinc-300 font-mono"> /admin/keys </span>
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="xl:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4"
          >
            <h2 className="text-zinc-100 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Admin Connection
            </h2>

            <div className="space-y-2">
              <Label htmlFor="base-url">Fabric API Base URL</Label>
              <Input
                id="base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://fabric.perceptor.us"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-key">Admin Key</Label>
              <div className="relative">
                <Input
                  id="admin-key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  type={showAdminKey ? "text" : "password"}
                  placeholder="fab_admin_..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminKey((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-zinc-500 hover:text-zinc-300"
                  aria-label="Toggle admin key visibility"
                >
                  {showAdminKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
              <Label htmlFor="remember-key" className="text-zinc-300">
                Remember key for this browser session
              </Label>
              <Switch
                id="remember-key"
                checked={rememberAdminKey}
                onCheckedChange={setRememberAdminKey}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={runVerify} disabled={isVerifying || !hasAdminInput}>
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
              <Button variant="secondary" onClick={runListKeys} disabled={isLoadingKeys || !hasAdminInput}>
                {isLoadingKeys ? "Loading..." : "List Keys"}
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={persistConnectionSettings}>
              Save Connection Settings
            </Button>

            {verifyResult && (
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-3 text-sm">
                <div className="text-teal-300 font-medium">Verified</div>
                <div className="text-zinc-300 mt-1">
                  Method: <span className="font-mono">{verifyResult.method}</span>
                </div>
                {verifyResult.scope && (
                  <div className="text-zinc-300">
                    Scope: <span className="font-mono">{String(verifyResult.scope)}</span>
                  </div>
                )}
              </div>
            )}

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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="xl:col-span-2 space-y-6"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="text-zinc-100 font-semibold mb-4">Create API Key</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Key Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="mcpfabric-prod-gateway"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-id">Owner ID</Label>
                  <Input
                    id="owner-id"
                    value={form.owner_id}
                    onChange={(e) => setForm((p) => ({ ...p, owner_id: e.target.value }))}
                    placeholder="mcpfabric-platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select
                    value={form.scope}
                    onValueChange={(value) => setForm((p) => ({ ...p, scope: value as KeyScope }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select key scope" />
                    </SelectTrigger>
                    <SelectContent>
                      {scopeOptions.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value}>
                          {scope.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-500">
                    {scopeOptions.find((scope) => scope.value === form.scope)?.help}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rpm">Rate Limit (RPM)</Label>
                  <Input
                    id="rpm"
                    type="number"
                    min={1}
                    max={10000}
                    value={form.rate_limit_rpm}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        rate_limit_rpm: Number(e.target.value) || 60,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In (Days)</Label>
                  <Input
                    id="expires"
                    type="number"
                    min={1}
                    max={3650}
                    value={form.expires_in_days ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        expires_in_days: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    placeholder="365"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-mode">Generate Test Key</Label>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 h-10">
                    <span className="text-sm text-zinc-300">Use fab_sk_test_* prefix</span>
                    <Switch
                      id="test-mode"
                      checked={Boolean(form.test)}
                      onCheckedChange={(checked) => setForm((p) => ({ ...p, test: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Button onClick={runCreateKey} disabled={isCreating || !hasAdminInput}>
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Key"
                  )}
                </Button>
              </div>
            </div>

            {latestCreated && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-amber-300 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Save This Key Now
                    </h3>
                    <p className="text-sm text-zinc-300 mt-1">
                      Raw key is shown only once. Store it in your secret manager.
                    </p>
                    <div className="mt-3 p-3 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-sm text-zinc-200 break-all">
                      {latestCreated.key}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                      <span>ID: {latestCreated.id}</span>
                      <span>Prefix: {latestCreated.prefix}</span>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={copyLatestKey}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-zinc-100 font-semibold">Active Keys</h2>
                <Button variant="outline" size="sm" onClick={runListKeys} disabled={isLoadingKeys}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingKeys && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {keys.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-500">
                  No keys loaded yet. Click <span className="text-zinc-300">List Keys</span>.
                </div>
              ) : (
                <div className="space-y-3">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-200 font-medium">{key.name}</span>
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                            {key.scope}
                          </Badge>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                            {key.prefix}
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-500">
                          owner={key.owner_id} · rpm={key.rate_limit_rpm} · created=
                          {new Date(key.created_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-zinc-500">
                          last_used={key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "never"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => runRevokeKey(key.id)}
                        disabled={revokingKeyId === key.id}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {revokingKeyId === key.id ? "Revoking..." : "Revoke"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </section>

        <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs text-zinc-500">
            Security note: this UI stores only the base URL in local storage. If session key remember is enabled, admin key is saved in
            session storage and cleared when browser session ends.
          </p>
          {adminKey && (
            <p className="mt-2 text-xs text-zinc-500">
              Current key preview: <span className="font-mono text-zinc-300">{maskToken(adminKey)}</span>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
