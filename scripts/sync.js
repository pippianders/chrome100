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

let sortByHits = consts.keys;
const keyHits = {};

const agent = new Agent({ maxSockets: 100, keepAlive: true });

/**
 * Returns URL to the build
 * @param {string} board
 * @param {string} code
 * @param {string} key
 * @return {string}
 */
function resolveURL(board, code, key) {
  return `https://dl.google.com/dl/edgedl/chromeos/recovery/chromeos_${code}_${board}_recovery_stable-channel_mp${
    key ? `-v${key}` : ''
  }.bin.zip`;
}

await data.store;

for (const board in consts.boards) {
  const versionPromises = [];

  for (const release in consts.versions) {
    const versions = consts.versions[release];

    if (!(board in data.store)) {
      data.store[board] = {
        processed: {},
        releases: {},
      };
    }

    const sboard = data.store[board];

    // run all versions concurrently
    for (const code of versions) {
      if (!sboard.processed[code]) {
        sboard.processed[code] = [];
      }

      const keyPromises = [];

      for (const key of sortByHits) {
        if (sboard.processed[code].includes(key)) continue;

        const url = resolveURL(board, code, key);

        keyPromises.push(
          (async () => {
            try {
              // console.time(url);

              const res = await fetch(url, {
                method: 'HEAD',
                agent,
              });

              // console.timeEnd(url);

              if (res.ok) {
                console.log('Found DL:', board, release, url);

                keyHits[key] = (keyHits[key] || 0) + 1;
                sboard.releases[release] = { key, code };
                sortByHits = consts.keys.sort(
                  (key1, key2) => (keyHits[key2] || 1) - (keyHits[key1] || 1)
                );
                data.save();
              } else if (res.status != 404) {
                console.error('Encountered', res.status);
              }
            } catch (err) {
              console.error(err);

              sboard.processed[code].push(key);
              data.save();

              return;
            }

            sboard.processed[code].push(key);
            data.save();
          })()
        );
      }

      if (!keyPromises.length) {
        continue;
      }

      versionPromises.push(keyPromises);

      if (versionPromises.length > 20) {
        const x = `run batch of ${
          versionPromises.length
        } promises, in batches: ${versionPromises.flat(2).length}`;
        console.time(x);
        console.log(versionPromises);
        await Promise.all(versionPromises.flat(1));
        versionPromises.length = 0;
        console.timeEnd(x);
      }
    }
  }

  await Promise.all(versionPromises.flat(1));
}

data.save();

console.log('Sync complete');
