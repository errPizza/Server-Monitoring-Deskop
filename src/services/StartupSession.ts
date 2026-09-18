export interface SessionDependencies {
  bypass: boolean;
  mock: boolean;
  loadToken: () => Promise<string | null>;
  refresh: () => Promise<boolean>;
}

// DEVELOPMENT ONLY: bypass must short-circuit before storage or network access.
export async function restoreStartupSession(deps: SessionDependencies): Promise<boolean> {
  if (deps.bypass || deps.mock) return true;
  if (!await deps.loadToken()) return false;
  return deps.refresh();
}
