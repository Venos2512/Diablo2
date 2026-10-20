// Persistent settings: one plain JSON tree, deep-merged over defaults, saved to localStorage.
// Modules register their own section defaults before the store is loaded.
const STORAGE_KEY = 'sanctuary-lookdev-lab:settings:v1';
const SESSION_KEY = 'sanctuary-lookdev-lab:session:v1';

const defaults = {
	scene: 'darkWood',
	tab: 'lookdev',
	quality: 'high',
	camera: { mode: 'orbit', fov: 35 },
	post: {
		toneMapping: 'agx',
		exposure: 0,
		aa: 'smaa',
		bloom: { enabled: true, strength: 0.35, radius: 0.4, threshold: 1.0 },
		ao: { enabled: true, intensity: 1.0, radius: 0.35, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, resolution: 0.5, denoise: true },
		fog: { enabled: false, density: 0.035, falloff: 0.35, height: 0.0, start: 3.0, color: '#56606a', inscatter: 0.6 },
		grade: { temperature: 0, tint: 0, saturation: 1, contrast: 1, lift: 0, gamma: 1, gain: 1, vignette: 0.22, grain: 0.0, chromatic: 0 },
		falseColor: false,
		retro: { enabled: false, height: 480, levels: 24, dither: 0.6 },
		lut: { look: 'none', intensity: 1 },
		check: 'none', // readability check view baked over the LUT (core/lut.js CHECK_VIEWS)
		vfxResolution: 1,
	},
};

function isObject(v) {
	return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function merge(target, source) {
	for (const key of Object.keys(source)) {
		const value = source[key];
		if (isObject(value)) {
			if (!isObject(target[key])) target[key] = {};
			merge(target[key], value);
		} else if (value !== undefined) {
			target[key] = Array.isArray(value) ? value.slice() : value;
		}
	}
	return target;
}

function clone(v) {
	return JSON.parse(JSON.stringify(v));
}

export function registerDefaults(section, values) {
	defaults[section] = merge(defaults[section] || {}, values);
}

function safeRead(storage, key) {
	try {
		const raw = storage.getItem(key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function safeWrite(storage, key, value) {
	try {
		storage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

export class Settings {
	constructor() {
		this.data = merge(clone(defaults), safeRead(localStorage, STORAGE_KEY) || {});
		this._timer = 0;
		this._listeners = new Set();
	}

	/** Re-apply defaults for sections registered after construction. */
	adopt(section) {
		this.data[section] = merge(clone(defaults[section] || {}), this.data[section] || {});
		return this.data[section];
	}

	get(path) {
		return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), this.data);
	}

	set(path, value) {
		const keys = path.split('.');
		const last = keys.pop();
		const parent = keys.reduce((o, k) => (o[k] ??= {}), this.data);
		parent[last] = value;
		this.changed(path);
	}

	changed(path = '') {
		clearTimeout(this._timer);
		this._timer = setTimeout(() => this.save(), 250);
		for (const fn of this._listeners) fn(path);
	}

	onChange(fn) {
		this._listeners.add(fn);
		return () => this._listeners.delete(fn);
	}

	save() {
		clearTimeout(this._timer);
		safeWrite(localStorage, STORAGE_KEY, this.data);
	}

	reset(section) {
		if (section) this.data[section] = clone(defaults[section] || {});
		else this.data = clone(defaults);
		this.save();
	}

	export() {
		return JSON.stringify({ app: 'sanctuary-lookdev-lab', schema: 1, settings: this.data }, null, 2);
	}

	import(text) {
		const parsed = JSON.parse(text);
		if (parsed?.app !== 'sanctuary-lookdev-lab' || !isObject(parsed.settings)) throw new Error('Not a Lookdev Lab preset file.');
		this.data = merge(clone(defaults), parsed.settings);
		this.save();
	}
}

/** Short-lived state (camera, selection) that should survive a dev reload or a renderer switch. */
export const session = {
	read() {
		return safeRead(sessionStorage, SESSION_KEY) || {};
	},
	write(value) {
		return safeWrite(sessionStorage, SESSION_KEY, value);
	},
	clear() {
		try {
			sessionStorage.removeItem(SESSION_KEY);
		} catch {
			/* ignore */
		}
	},
};
