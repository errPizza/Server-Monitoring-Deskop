import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { restoreStartupSession } from "../services/StartupSession";
import { environment } from "../config/environment";
import { authService, MobileLoginResult, tokenStore } from "../services/AuthService";

export type AuthState =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "pending";
interface AuthContextValue {
  state: AuthState;
  error?: string;
  pendingDevice?: string;
  login: (email: string, password: string) => Promise<MobileLoginResult>;
  logout: () => Promise<void>;
  retrySession: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("checking");
  const [error, setError] = useState<string>();
  const [pendingDevice, setPendingDevice] = useState<string>();
  const retrySession = useCallback(async () => {
    setState("checking");
    try {
      const authenticated = await restoreStartupSession({
        bypass: environment.bypassAuth,
        mock: environment.mode === "mock",
        loadToken: () => tokenStore.load(),
        refresh: () => authService.refresh(),
      });
      setState(authenticated ? "authenticated" : "unauthenticated");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to restore session.");
      setState("unauthenticated");
    }
  }, []);
  // Startup is triggered by the final intro scene, while its real status is visible.
  const login = useCallback(async (email: string, password: string) => {
    setError(undefined);
    try {
      const result = await authService.login(email, password);
      if (result.status === "pending") {
        setPendingDevice(result.session.deviceName);
        setState("pending");
      } else {
        setPendingDevice(undefined);
        setState("authenticated");
      }
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      throw cause;
    }
  }, []);
  const logout = useCallback(async () => {
    // DEVELOPMENT ONLY: keep the temporary offline session independent of the RPi.
    if (environment.bypassAuth) { setState("authenticated"); return; }
    await authService.logout();
    setPendingDevice(undefined);
    setState("unauthenticated");
  }, []);
  const value = useMemo(
    () => ({ state, error, pendingDevice, login, logout, retrySession }),
    [state, error, pendingDevice, login, logout, retrySession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};