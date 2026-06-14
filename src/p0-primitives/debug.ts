const DEBUG = (() => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('ds-debug') === 'true') return true;
    const g = globalThis as unknown as { process?: { env?: Record<string, string> } };
    if (typeof g.process === 'object' && g.process?.env?.DS_DEBUG === 'true') return true;
    return false;
  } catch {
    return false;
  }
})();

export const debug = {
  log: (...args: unknown[]) => { if (DEBUG) console.log('[ds]', ...args); },
  warn: (...args: unknown[]) => { if (DEBUG) console.warn('[ds]', ...args); },
  error: (...args: unknown[]) => { if (DEBUG) console.error('[ds]', ...args); },
};
