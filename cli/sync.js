import Sync from '../Sync.js';

export default async function sync(){
	const sync = new Sync(data);
	
	console.log('Syncing...');

	await sync.run();

	console.log('Sync complete');
}
