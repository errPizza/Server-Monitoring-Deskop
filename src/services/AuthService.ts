import { secureStore as SecureStore, apiFetch, desktop } from "./Desktop";
import { Platform } from "react-native";
import { environment } from "../config/environment";

const ACCESS_TOKEN_KEY = "pi-command-center.access-token";
const REFRESH_TOKEN_KEY = "pi-command-center.refresh-token";
const DEVICE_ID_KEY = "pi-command-center.device-id";

export type MobileLoginResult =
  | {
      status: "approved";
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresIn: number;
    }
  | {
      status: "pending";
      session: { id: string; deviceName: string; requestedAt: number };
    };

class TokenStore {
  private accessToken: string | null = null;
  async load() {
    this.accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return this.accessToken;
  }
  getAccessToken() {
    return this.accessToken;
  }
  async set(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }
  async clear() {
    this.accessToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }
  async deviceId() {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id = `desktop-${crypto.randomUUID()}`;
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    return id;
  }
}
export const tokenStore = new TokenStore();

async function authRequest<T>(path: string, body: object): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), environment.requestTimeoutMs);
  try {
  const response = await apiFetch(`${environment.apiBaseUrl}/mobile/auth${path}`, {
    signal: controller.signal,
    method: "POST",
    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      payload.error ?? "Unable to authenticate with monitoring API.",
    );
  return payload as T;
  } finally { clearTimeout(timer); }
}

let refreshInFlight: Promise<boolean> | undefined;
export const authService = {
  async login(email: string, password: string): Promise<MobileLoginResult> {
    const deviceId = await tokenStore.deviceId();
    const result = await authRequest<MobileLoginResult>("/login", {
      email,
      password,
      deviceId,
      deviceName: `AGM Server Monitoring · ${desktop?.config.platform ?? Platform.OS}`,
      platform: desktop?.config.platform ?? Platform.OS,
      appVersion: "1.0.0",
    });
    if (result.status === "approved")
      await tokenStore.set(result.accessToken, result.refreshToken);
    return result;
  },
  refresh(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const result = await authRequest<
        Extract<MobileLoginResult, { status: "approved" }>
      >("/refresh", { refreshToken });
      await tokenStore.set(result.accessToken, result.refreshToken);
      return true;
    } catch {
      await tokenStore.clear();
      return false;
    }
    })().finally(() => { refreshInFlight = undefined; });
    return refreshInFlight;
  },
  async logout() {
    const accessToken = tokenStore.getAccessToken();
    try {
      if (accessToken)
        await apiFetch(`${environment.apiBaseUrl}/mobile/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
    } finally {
      await tokenStore.clear();
    }
  },
};
