interface DesktopBridge {
  config: { mode: 'mock' | 'production'; apiBaseUrl: string; platform: string };
  store(action: 'get' | 'set' | 'delete', key: string, value?: string): Promise<string | null>;
  request(url: string, options: { method?: string; headers: Record<string, string>; body?: string }): Promise<{ status: number; body: string }>;
  dialog(title: string, message: string, buttons: string[]): Promise<number>;
}
declare global { interface Window { desktop?: DesktopBridge } }
export const desktop = typeof window !== 'undefined' ? window.desktop : undefined;
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!desktop) return fetch(url, options);
  const result = await desktop.request(url, { method: options.method, headers: Object.fromEntries(new Headers(options.headers).entries()), body: options.body as string | undefined });
  return new Response(result.body || null, { status: result.status });
}
// Browser preview keeps secrets in memory; the installed app uses the OS keyring.
const memory = new Map<string, string>();
export const secureStore = {
  getItemAsync: async (key: string) => desktop ? desktop.store('get', key) : memory.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => { if (desktop) await desktop.store('set', key, value); else memory.set(key, value); },
  deleteItemAsync: async (key: string) => { if (desktop) await desktop.store('delete', key); else memory.delete(key); },
};
export const DesktopAlert = {
  alert(title: string, message = '', buttons: { text?: string; style?: string; onPress?: () => void }[] = [{ text: 'OK' }]) {
    if (desktop) { void desktop.dialog(title, message, buttons.map(button => button.text || 'OK')).then(index => buttons[index]?.onPress?.()); }
    else if (buttons.length === 1) { window.alert(`${title}\n${message}`); buttons[0].onPress?.(); }
    else if (window.confirm(`${title}\n${message}`)) buttons.find(button => button.style !== 'cancel')?.onPress?.();
  },
};
