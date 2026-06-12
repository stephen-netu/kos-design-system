// T0 Transport — file persistence over the optional Tauri FS plugin.
//
// Follows the same optional-peer pattern as invoke.ts: a literal dynamic
// import of the Tauri module, guarded at runtime by isTauri(). In a non-Tauri
// environment every operation rejects with FsUnavailableError — callers must
// surface that state instead of pretending the operation succeeded.
//
// NOTE: deliberately NOT re-exported from the t0-transport barrel. The barrel
// is reachable from the root package export; keeping fs.ts subpath-only means
// consumers who never import the editor never make their bundler resolve
// '@tauri-apps/plugin-fs' (an optional peer). Import it directly:
//   import { readTextFile, writeTextFile } from '<pkg>/t0-transport/fs' (internal: '../t0-transport/fs')

import { isTauri } from './invoke';

export { isTauri } from './invoke';

/** Thrown when no Tauri runtime (or no fs plugin) is available. */
export class FsUnavailableError extends Error {
	constructor(operation: string, cause?: unknown) {
		super(
			`File ${operation} unavailable: no Tauri runtime detected. ` +
				'Persistence requires a Tauri host with @tauri-apps/plugin-fs installed.'
		);
		this.name = 'FsUnavailableError';
		if (cause !== undefined) (this as Error & { cause?: unknown }).cause = cause;
	}
}

async function loadFs(operation: string): Promise<typeof import('@tauri-apps/plugin-fs')> {
	if (!isTauri()) throw new FsUnavailableError(operation);
	try {
		return await import('@tauri-apps/plugin-fs');
	} catch (cause) {
		throw new FsUnavailableError(operation, cause);
	}
}

/** Read a text file. Rejects with FsUnavailableError outside a Tauri host. */
export async function readTextFile(path: string): Promise<string> {
	const fs = await loadFs('read');
	return fs.readTextFile(path);
}

/** Write a text file. Rejects with FsUnavailableError outside a Tauri host — never a silent no-op. */
export async function writeTextFile(path: string, contents: string): Promise<void> {
	const fs = await loadFs('write');
	await fs.writeTextFile(path, contents);
}

/** Last-modified time in epoch ms, or null when the backend can't provide one. */
export async function getMtimeMs(path: string): Promise<number | null> {
	const fs = await loadFs('stat');
	const info = await fs.stat(path);
	return info?.mtime ? new Date(info.mtime).getTime() : null;
}
