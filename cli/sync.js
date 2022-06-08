import Sync from '../Sync.js';
import DataStore from '../DataStore.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = new DataStore(join(__dirname, '..', 'data.json'));
const sync = new Sync(data);

console.log('Syncing...');

await sync.run();

console.log('Sync complete');
