import { createContext, useContext, useEffect, useState } from "react";
import {
  beginPassportLogin,
  beginPassportLogout,
  clearPassportSession,
  completePassportLogin,
  loadPassportSession,
  type PassportSession,
} from "@/lib/passport-auth";
import { logAuthTrace } from "@/lib/auth-trace";

interface AuthContextValue {
  session: PassportSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  finishCallback: (callbackUrl: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PassportSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logAuthTrace("auth-context", "Initializing auth context");
    setSession(loadPassportSession());
    setIsLoading(false);
    logAuthTrace("auth-context", "Auth context initialized");
  }, []);

  async function login(returnTo?: string) {
    logAuthTrace("auth-context", "Login requested", { returnTo });
    await beginPassportLogin(returnTo);
  }

  async function logout() {
    const current = session;
    logAuthTrace("auth-context", "Logout requested", {
      hasSession: Boolean(current),
      subject: current?.user.sub,
    });
    setSession(null);
    await beginPassportLogout(current);
  }

  async function finishCallback(callbackUrl: string) {
    logAuthTrace("auth-context", "Finishing callback", { callbackUrl });
    const result = await completePassportLogin(callbackUrl);
    setSession(result.session);
    logAuthTrace("auth-context", "Callback finished", {
      returnTo: result.returnTo,
      subject: result.session.user.sub,
    });
    return result.returnTo;
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.expiresAt <= Date.now()) {
      clearPassportSession();
      setSession(null);
      logAuthTrace("session", "Auth context cleared expired session", {
        expiresAt: session.expiresAt,
      });
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: Boolean(session),
        isLoading,
        login,
        logout,
        finishCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
