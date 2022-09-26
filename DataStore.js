import { readFile, writeFile } from 'node:fs/promises';

export default class DataStore {
	constructor(file, store) {
		this.file = file;

		this.timeouts = new Set();
		this.intervals = new Set();

		this.setInterval(() => this.save(), 1000);

		this.store = store;
	}
	change() {
		if (this.closed) throw new Error('DataStore is closed.');
		this.changed = true;
	}
	async save() {
		if (this.closed) throw new Error('DataStore is closed.');
		if (!this.changed) return;
		await writeFile(this.file, JSON.stringify(this.store));
		this.changed = false;
	}
	setTimeout(callback, time) {
		if (this.closed) throw new Error('DataStore is closed.');
		var res = setTimeout(callback, time);
		this.timeouts.add(res);
		return res;
	}
	setInterval(callback, time) {
		if (this.closed) throw new Error('DataStore is closed.');
		var res = setInterval(callback, time);
		this.intervals.add(res);
		return res;
	}
	close() {
		this.closed = true;

		for (let timeout of this.timeouts) clearTimeout(timeout);
		for (let interval of this.intervals) clearInterval(interval);
	}
}

export async function openDataStore(file, fallback = {}) {
	let store = fallback;

	try {
		store = JSON.parse(await readFile(file));
	} catch (err) {
		if (err?.code !== 'ENOENT') throw err;
	}

	return new DataStore(file, store);
}
