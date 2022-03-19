import server from './cli/server.js';
import updateEdgeDL from './cli/updateEdgeDL.js';
import sync from './cli/sync.js';
import { Command, Option } from 'commander';

const program = new Command();

program
.command('server')
.addOption(new Option('--h, --host <string>', 'Listening host').default('localhost'))
.addOption(new Option('--p, --port <number>', 'Listening port').default(80).env('PORT'))
.action(server)
;

program
.command('updateEdgeDL')
.action(updateEdgeDL)
;

program
.command('sync')
.action(sync)
;

program.parse(process.argv);