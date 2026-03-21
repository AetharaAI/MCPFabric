import { createContext, useContext, useEffect, useState } from "react";
import {
  beginPassportLogin,
  beginPassportLogout,
  clearPassportSession,
  completePassportLogin,
  loadPassportSession,
  type PassportSession,
} from "@/lib/passport-auth";

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
    setSession(loadPassportSession());
    setIsLoading(false);
  }, []);

  async function login(returnTo?: string) {
    await beginPassportLogin(returnTo);
  }

  async function logout() {
    const current = session;
    setSession(null);
    await beginPassportLogout(current);
  }

  async function finishCallback(callbackUrl: string) {
    const result = await completePassportLogin(callbackUrl);
    setSession(result.session);
    return result.returnTo;
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    if (session.expiresAt <= Date.now()) {
      clearPassportSession();
      setSession(null);
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
