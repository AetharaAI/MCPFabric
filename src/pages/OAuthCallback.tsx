import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export function OAuthCallback() {
  const navigate = useNavigate();
  const { finishCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      try {
        const returnTo = await finishCallback(window.location.href);
        if (!cancelled) {
          navigate(returnTo || "/", { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Passport callback failed");
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
      </div>
    </main>
  );
}
