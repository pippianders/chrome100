import DataStore from '../DataStore.js';
import { appBuild, appData } from '../config/paths.js';
import { Command, Option } from 'commander';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';

const program = new Command();

program
	.addOption(
		new Option('--h, --host <string>', 'Listening host').default('localhost')
	)
	.addOption(
		new Option('--p, --port <number>', 'Listening port').default(80).env('PORT')
	)
	.action(({ port, host }) => {
		const data = new DataStore(appData);
		const server = fastify({ logger: false });

		server.register(
			async server => {
				server.route({
					url: '/data',
					method: 'GET',
					handler(_request, reply) {
						const out = {};

						for (let board in data.store) {
							const releases = [];

							for (let release in data.store[board]) {
								releases.push(release);
							}

							out[board] = releases;
						}

						for (let [board, { releases }] of Object.entries(data.store))
							out[board] = Object.keys(releases);

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
					handler(request, reply) {
						const { board, release } = request.query;

						const board_store = data.store[board];

						if (!board_store) {
							throw new RangeError('Unknown board');
						}

						const meta = board_store.releases[release];

						if (!meta) {
							throw new RangeError('Unknown release');
						}

						const { code, key } = meta;

						reply.redirect(
							`https://dl.google.com/dl/edgedl/chromeos/recovery/chromeos_${code}_${board}_recovery_stable-channel_mp${
								key ? '-v' + key : ''
							}.bin.zip`
						);
					},
				});
			},
			{
				prefix: '/api',
			}
		);

		server.register(fastifyStatic, { root: appBuild });

		server.listen(port, host, (error, url) => {
			if (error) {
				console.error(error);
				process.exit(1);
			}

			console.log('Server listening. View live at', url);
		});
	});

program.parse(process.argv);
