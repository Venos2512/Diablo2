// A fixed pool for short-lived effects (prints, ripples, droplets): never allocates after construction, never grows. acquire() hands out a free item or
// recycles the oldest live one, so a long walk keeps a bounded trail instead of an ever-growing one. Pure maths.

export class FxPool {
	/** items: the preallocated objects ({ active, age, life, ... }); onRetire(item) hides / resets an item that ended or was recycled. */
	constructor(items, onRetire = () => {}) {
		this.items = items;
		this.onRetire = onRetire;
		this.live = 0;
		this.serial = 0;
		for (const it of items) {
			it.active = false;
			it.age = 0;
			it.life = 1;
			it.serial = 0;
		}
	}

	get capacity() {
		return this.items.length;
	}

	acquire(life) {
		let pick = null;
		let oldest = null;
		for (const it of this.items) {
			if (!it.active) {
				pick = it;
				break;
			}
			if (!oldest || it.serial < oldest.serial) oldest = it;
		}
		if (!pick) {
			pick = oldest; // recycle the oldest live item
			this.onRetire(pick);
		} else this.live++;
		pick.active = true;
		pick.age = 0;
		pick.life = life;
		pick.serial = ++this.serial;
		return pick;
	}

	/** Advance every live item; fn(item, t 0..1) updates it, items past their life are retired. */
	update(dt, fn) {
		if (!this.live) return;
		for (const it of this.items) {
			if (!it.active) continue;
			it.age += dt;
			if (it.age >= it.life) {
				it.active = false;
				this.live--;
				this.onRetire(it);
				continue;
			}
			fn(it, it.age / it.life);
		}
	}

	clear() {
		if (!this.live) return;
		for (const it of this.items) {
			if (!it.active) continue;
			it.active = false;
			this.onRetire(it);
		}
		this.live = 0;
	}
}
