import { Command, Option } from 'commander';

const program = new Command();

program
.addOption(new Option('--h, --host <string>', 'Listening host').default('localhost'))
.addOption(new Option('--p, --port <number>', 'Listening port').default(80).env('PORT'))
;

program.parse(process.argv);

const options = program.opts();

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Sync from './Sync.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const data = new DataStore(join(__dirname, 'data.json'));
const sync = new Sync(data);

import Compiler from './Compiler.mjs';
import DataStore from './DataStore.mjs';

const compiler = new Compiler(data);
const sync_operation = sync.run();

import Fastify, { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';

const server = new Fastify({ logger: false });

console.log('Syncing...');

sync_operation.then(() => {
	sync_operation.resolved = true;
	console.log('Sync complete');
	
	compiler.init();
});

server.route({
	url: '/data',
	method: 'GET',
	handler(request, reply){
		if(!sync_operation.resolved)return reply.code(500).send(new Error('Server is undergoing syncing...'));
		
		var out = {};
		
		for(let [ board, { releases } ] of Object.entries(data.store))out[board] = Object.keys(releases);
		
		reply.send(out);
	},
});

server.route({
	url: '/download',
	method: 'GET',
	querystring: {
		board: { type: 'string' },
		release: { type: 'integer' },
	},
	handler(request, reply){
		if(!sync_operation.resolved)return reply.code(500).send(new Error('Server is undergoing syncing...'));
		
		var { board, release } = request.query;
		
		var board_store = data.store[board];
		if(!board_store)throw new RangeError('Unknown board');
		
		var meta = board_store.releases[release];
		if(!meta)throw new RangeError('Unknown release');
		
		var { code, key } = meta;
		
		reply.redirect(`https://dl.google.com/dl/edgedl/chromeos/recovery/chromeos_${code}_${board}_recovery_stable-channel_mp${key ? '-v' + key : ''}.bin.zip`);
	},
});

server.register(fastifyStatic, { root: compiler.web });

server.listen(options.port, options.host, (error, url) => {
	if(error){
		console.error(error);
		process.exit(1);
	}
	
	console.log('Server listening. View live at', url);
});