// Browser cache of generated maps (AD 12 §4.14): one IndexedDB object store, key → value (structured-cloneable: the baked layout object,
// a Uint8Array of splat data). Where IndexedDB is missing or fails (private mode, quota, an old browser) every call quietly does
// nothing and get() answers null, so a map is simply generated again: the cache is an optimisation, never a dependency.
// Entries (≈ 1.5 MB per map) belong to a GROUP (a map: its layout, splat and generator record); the groups are used least-recently-last:
// after a put, everything but the last GROUP_LIMIT groups is deleted, so rolling many seeds does not fill the disk. The use list is one
// record under LRU_KEY of the same store; every update of it is a single readwrite transaction (atomic across tabs).
const DB_NAME = 'sanctuary-lab-maps';
const STORE = 'maps';
const LRU_KEY = '~lru';
export const GROUP_LIMIT = 12; // maps kept

let opened = null;

function open() {
	if (typeof indexedDB === 'undefined') return Promise.resolve(null);
	opened ??= new Promise((resolve) => {
		try {
			const request = indexedDB.open(DB_NAME, 1);
			request.onupgradeneeded = () => request.result.createObjectStore(STORE);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => resolve(null);
			request.onblocked = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
	return opened;
}

/**
 * One transaction on the store: `body(store, tx)` issues the requests and returns the value to resolve with once the transaction has
 * committed; null on any failure. A readwrite transaction excludes every other one on the store (other tabs, an old page's deferred
 * writes), which is what makes the use-list updates below atomic.
 */
async function transact(mode, body) {
	const db = await open();
	if (!db) return null;
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(STORE, mode);
			const result = body(tx.objectStore(STORE));
			tx.oncomplete = () => resolve(typeof result === 'function' ? result() : (result?.result ?? null));
			tx.onerror = tx.onabort = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
}

/**
 * Reads the use list ({ groups: { group: lastUse }, members: { key: group } }) inside the caller's readwrite transaction and hands it to
 * `fn(lru, save)`; `fn` changes it and calls `save()` to write it back. Everything runs from request callbacks, so the transaction
 * stays open until the last request is done.
 */
function withLru(store, fn) {
	const request = store.get(LRU_KEY);
	request.onsuccess = () => {
		const lru = request.result ?? { groups: {}, members: {} };
		lru.groups ??= {};
		lru.members ??= {};
		fn(lru, () => store.put(lru, LRU_KEY));
	};
}

/** Adopts old entries without a group, then deletes the entries of every group but the `limit` most recently used; calls `done` after the deletes are issued. */
function evict(store, lru, limit, done) {
	const request = store.getAllKeys();
	request.onsuccess = () => {
		for (const key of request.result ?? []) {
			if (key === LRU_KEY || lru.members[key]) continue;
			const legacy = /^[0-9a-f]{28}/.exec(key); // entries from before the use list: a layout key, or a splat key that starts with one, names the map
			if (!legacy) continue; // anything else is not ours to evict
			lru.members[key] = legacy[0];
			lru.groups[lru.members[key]] ??= 0;
		}
		const groups = Object.entries(lru.groups).sort((a, b) => b[1] - a[1]).map(([g]) => g);
		const drop = new Set(groups.slice(limit));
		if (drop.size) {
			const dead = Object.keys(lru.members).filter((k) => drop.has(lru.members[k]));
			for (const k of dead) {
				store.delete(k);
				delete lru.members[k];
			}
			for (const g of drop) delete lru.groups[g];
		}
		done();
	};
}

export const mapCache = {
	/** The value stored under `key`, or null. A hit marks the map as just used (its own readwrite step; not waited for). */
	async get(key) {
		const value = (await transact('readonly', (store) => store.get(key))) ?? null;
		if (value !== null) transact('readwrite', (store) => withLru(store, (lru, save) => {
			const group = lru.members[key];
			if (group) {
				lru.groups[group] = Date.now();
				save();
			}
		}));
		return value;
	},
	/**
	 * Stores `value` under `key` in `group` (default: the key itself); true when it was written. The value, the registration in the use
	 * list and the eviction of the old groups are ONE readwrite transaction: another tab or a late write of an older page cannot lose a
	 * registration (a record without one would never be evicted) nor evict an entry that is not registered yet.
	 */
	async put(key, value, group = key) {
		const written = await transact('readwrite', (store) => {
			store.put(value, key);
			withLru(store, (lru, save) => {
				lru.members[key] = group;
				lru.groups[group] = Date.now();
				evict(store, lru, GROUP_LIMIT, save);
			});
			return () => true;
		});
		return written === true;
	},
	/** Removes every entry; resolves the number of entries that were there. */
	async clear() {
		const n = (await transact('readonly', (store) => store.count())) ?? 0;
		await transact('readwrite', (store) => store.clear());
		return n;
	},
	/** Keys stored now. */
	async keys() {
		return ((await transact('readonly', (store) => store.getAllKeys())) ?? []).filter((k) => k !== LRU_KEY);
	},
};
