import { desktop } from '../services/Desktop';
export type AppEnvironment = 'mock' | 'production';

export const environment = {
  mode: (desktop?.config.mode ?? (process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 'production' : 'mock')) as AppEnvironment,
  apiBaseUrl: desktop?.config.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://www.anothergamemore.online/api',
  // DEVELOPMENT ONLY: Temporary authentication bypass.
  // Never enable this flag in production.
  bypassAuth: false,
  requestTimeoutMs: 10_000,
};

// Credentials and session tokens never belong in public Expo variables.
// The production API uses the encrypted device storage adapter in AuthService.
