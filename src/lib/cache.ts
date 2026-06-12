import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Read-side cache for API data (projects list, project views, board pages),
 * ported from freespeech-v2's IndexedDB blob cache: screens render instantly
 * from the last-known copy, then revalidate from the network. Unlike v2 there
 * is no write sync — freespeech-api has no blob/sync endpoints — so entries
 * are never "dirty" and the server always wins.
 */

const PREFIX = 'fs-cache:';

// Android's AsyncStorage database defaults to ~6MB total — stay well under it.
const MAX_CACHE_BYTES = 4 * 1024 * 1024;

type Entry<T> = { value: T; cachedAt: number };

export const cacheKeys = {
	projects: 'projects',
	project: (projectId: string) => `project:${projectId}`,
	board: (projectId: string, pageId: string) => `board:${projectId}/${pageId}`
};

export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const raw = await AsyncStorage.getItem(PREFIX + key);
		if (!raw) return null;
		return (JSON.parse(raw) as Entry<T>).value;
	} catch {
		return null;
	}
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
	try {
		const entry: Entry<unknown> = { value, cachedAt: Date.now() };
		await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
		pruneCache();
	} catch {
		// Cache writes are best-effort; the network copy is the source of truth.
	}
}

export async function cacheDelete(key: string): Promise<void> {
	await AsyncStorage.removeItem(PREFIX + key).catch(() => {});
}

/** Purge a deleted project's view and every board cached under it. */
export async function cacheDeleteProject(projectId: string): Promise<void> {
	try {
		const keys = (await AsyncStorage.getAllKeys()).filter(
			(k) =>
				k === PREFIX + cacheKeys.project(projectId) ||
				k.startsWith(`${PREFIX}board:${projectId}/`)
		);
		if (keys.length) await AsyncStorage.multiRemove(keys);
	} catch {}
}

/** Purge a deleted page's boards across all projects it was connected to. */
export async function cacheDeletePage(pageId: string): Promise<void> {
	try {
		const keys = (await AsyncStorage.getAllKeys()).filter(
			(k) => k.startsWith(`${PREFIX}board:`) && k.endsWith(`/${pageId}`)
		);
		if (keys.length) await AsyncStorage.multiRemove(keys);
	} catch {}
}

/** Drop everything — called on sign-out so data never leaks across accounts. */
export async function clearCache(): Promise<void> {
	try {
		const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
		if (keys.length) await AsyncStorage.multiRemove(keys);
	} catch {}
}

let pruning = false;

/** Best-effort trim back to the size cap, oldest entries first (like v2's evictLRUIfNeeded). */
async function pruneCache(): Promise<void> {
	if (pruning) return;
	pruning = true;
	try {
		const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
		const pairs = await AsyncStorage.multiGet(keys);

		let total = 0;
		const entries: { key: string; size: number; cachedAt: number }[] = [];
		for (const [key, raw] of pairs) {
			if (!raw) continue;
			let cachedAt = 0;
			try {
				cachedAt = (JSON.parse(raw) as Entry<unknown>).cachedAt ?? 0;
			} catch {}
			entries.push({ key, size: raw.length, cachedAt });
			total += raw.length;
		}
		if (total <= MAX_CACHE_BYTES) return;

		entries.sort((a, b) => a.cachedAt - b.cachedAt);
		for (const entry of entries) {
			if (total <= MAX_CACHE_BYTES) break;
			await AsyncStorage.removeItem(entry.key);
			total -= entry.size;
		}
	} catch {
	} finally {
		pruning = false;
	}
}
