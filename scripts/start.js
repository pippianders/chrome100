import { openDataStore } from '../DataStore.js';
import { Command, Option } from 'commander';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import { resolve } from 'node:path';

const program = new Command();

program
  .addOption(
    new Option('--h, --host <string>', 'Listening host').default('localhost')
  )
  .addOption(
    new Option('--p, --port <number>', 'Listening port').default(80).env('PORT')
  )
  .action(async ({ port, host }) => {
    const data = await openDataStore('bin/data.json');
    const server = fastify({ logger: false });

    server.register(
      async (server) => {
        server.route({
          url: '/data',
          method: 'GET',
          handler(request, reply) {
            const out = {};

            for (const board in data.store) {
              const releases = [];

              for (const release in data.store[board]) {
                releases.push(release);
              }

              out[board] = releases;
            }

            for (const [board, { releases }] of Object.entries(data.store)) {
              out[board] = Object.keys(releases);
            }

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

            const boardStore = data.store[board];

            if (!boardStore) {
              throw new RangeError('Unknown board');
            }

            const meta = boardStore.releases[release];

            if (!meta) {
              throw new RangeError('Unknown release');
            }

            const { code, key } = meta;

            reply.redirect(
              `https://dl.google.com/dl/edgedl/chromeos/recovery/chromeos_${code}_${board}_recovery_stable-channel_mp${
                key ? `-v${key}` : ''
              }.bin.zip`
            );
          },
        });
      },
      {
        prefix: '/api',
      }
    );

    server.register(fastifyStatic, { root: resolve('build') });

    server.listen(
      {
        host,
        port,
      },
      (error, url) => {
        if (error) {
          console.error(error);
          process.exit(1);
        }

        console.log('Server listening. View live at', url);
      }
    );
  });

program.parse(process.argv);
