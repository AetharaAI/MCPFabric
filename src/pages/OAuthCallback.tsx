import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { getAuthTrace } from "@/lib/auth-trace";

export function OAuthCallback() {
  const navigate = useNavigate();
  const { finishCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState(() => getAuthTrace());

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      try {
        const returnTo = await finishCallback(window.location.href);
        if (!cancelled) {
          setTrace(getAuthTrace());
          navigate(returnTo || "/", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Passport callback failed");
          setTrace(getAuthTrace());
        }
      }
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [finishCallback, navigate]);

  return (
    <main className="min-h-screen bg-zinc-950 pt-16 pb-14 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
          {error ? <ShieldCheck className="h-5 w-5 text-red-300" /> : <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />}
        </div>
        <h1 className="text-lg font-semibold text-zinc-100">Passport Callback</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {error ? error : "Completing sign-in with Passport..."}
        </p>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-left">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Auth Trace
            </h2>
            <span className="text-xs text-zinc-500">{trace.length} entries</span>
          </div>
          <div className="max-h-72 space-y-2 overflow-auto">
            {trace.length === 0 ? (
              <p className="text-xs text-zinc-500">No auth trace entries yet.</p>
            ) : (
              trace.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-cyan-300">{entry.stage}</span>
                    <span className="text-[11px] text-zinc-500">{entry.at}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-200">{entry.message}</p>
                  {entry.details ? (
                    <pre className="mt-2 overflow-auto rounded bg-black/30 p-2 text-[11px] text-zinc-400">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
