import server from './cli/server.js';
import { Command, Option } from 'commander';

const program = new Command();

program
.command('server')
.addOption(new Option('--h, --host <string>', 'Listening host').default('localhost'))
.addOption(new Option('--p, --port <number>', 'Listening port').default(80).env('PORT'))
.action(server)
;

program.parse(process.argv);