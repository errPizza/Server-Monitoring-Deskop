import { desktop } from '../services/Desktop';
export type AppEnvironment = 'mock' | 'production';

export const environment = {
  mode: (desktop?.config.mode ?? (process.env.EXPO_PUBLIC_APP_ENV === 'production' ? 'production' : 'mock')) as AppEnvironment,
  apiBaseUrl: desktop?.config.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://www.anothergamemore.online/api',

  bypassAuth: false,
  requestTimeoutMs: 10_000,
};
