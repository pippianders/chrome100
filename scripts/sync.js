import DataStore from '../DataStore.js';
import { appData } from '../config/paths.js';
import { readConsts } from '../consts.js';
import fetch from 'node-fetch';
import { Agent } from 'node:https';
import { TLSSocket } from 'node:tls';

const data = new DataStore(appData);

console.log('Syncing...');

const consts = await readConsts();

TLSSocket.setMaxListeners(1000);

let sort_by_hits = consts.keys;
const key_hits = {};

const agent = new Agent({ maxSockets: 100, keepAlive: true });

function resolveURL(board, code, key) {
	return (
		'https://dl.google.com/dl/edgedl/chromeos/recovery/chromeos_' +
		code +
		'_' +
		board +
		'_recovery_stable-channel_mp' +
		(key ? '-v' + key : '') +
		'.bin.zip'
	);
}

await data.store;

for (let board in consts.boards) {
	const version_promises = [];

	for (let release in consts.versions) {
		const versions = consts.versions[release];

		if (!(board in data.store)) {
			data.store[board] = {
				processed: {},
				releases: {},
			};
		}

		let sboard = data.store[board];

		// run all versions concurrently
		for (let code of versions) {
			if (!sboard.processed[code]) {
				sboard.processed[code] = [];
			}

			const key_promises = [];

			for (let key of sort_by_hits) {
				if (sboard.processed[code].includes(key)) continue;

				const url = resolveURL(board, code, key);

				key_promises.push(
					(async () => {
						try {
							// console.time(url);

							const res = await fetch(url, {
								method: 'HEAD',
								agent: agent,
							});

							// console.timeEnd(url);

							if (res.ok) {
								console.log('Found DL:', board, release, url);

								key_hits[key] = (key_hits[key] || 0) + 1;
								sboard.releases[release] = { key, code };
								sort_by_hits = consts.keys.sort(
									(key1, key2) => (key_hits[key2] || 1) - (key_hits[key1] || 1)
								);
								data.change();
							} else {
								if (res.status != 404) console.error('Encountered', res.status);
							}
						} catch (err) {
							console.error(err);

							sboard.processed[code].push(key);
							data.change();

							return;
						}

						sboard.processed[code].push(key);
						data.change();
					})()
				);
			}

			if (!key_promises.length) {
				continue;
			}

			version_promises.push(key_promises);

			if (version_promises.length > 20) {
				const x = `run batch of ${
					version_promises.length
				} promises, in batches: ${version_promises.flat(2).length}`;
				console.time(x);
				console.log(version_promises);
				await Promise.all(version_promises.flat(1));
				version_promises.length = 0;
				console.timeEnd(x);
			}
		}
	}

	await Promise.all(version_promises.flat(1));
}

await data.save();
await data.close();

console.log('Sync complete');
