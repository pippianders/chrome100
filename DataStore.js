import { readFile, writeFile } from 'node:fs/promises';

/**
 * Carefully write JSON data.
 */
export default class DataStore {
  /**
   *
   * @param {string} file
   * @param {object} store
   */
  constructor(file, store) {
    this.file = file;
    this.store = store;
  }
  /**
   * Trigger an async save.
   * @return {Promise<void>}
   */
  save() {
    if (!this.saving) {
      this.saving = setTimeout(async () => {
        await writeFile(this.file, JSON.stringify(this.store, null, '\t'));
        this.saving = undefined;
      }, 1000);
    }

    return this.saving;
  }
}

/**
 * Asynchronously open a DataStore.
 * @param {string} file
 * @param {object} fallback
 * @return {Promise<DataStore>}
 */
export async function openDataStore(file, fallback = {}) {
  let store = fallback;

  try {
    store = JSON.parse(await readFile(file));
  } catch (err) {
    if (err?.code !== 'ENOENT') throw err;
  }

  return new DataStore(file, store);
}
