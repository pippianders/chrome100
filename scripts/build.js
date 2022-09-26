import { openDataStore } from '../DataStore.js';
import { readConsts } from '../consts.js';
import { copy } from 'fs-extra';
import { marked } from 'marked';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const consts = await readConsts();

const data = await openDataStore('bin/data.json');

const cats = ['Board', 'Releases', 'Models'];
const extend = [];

extend.push(`|${cats.map(cat => ` ${cat} `).join('|')}|`);
extend.push(`|${cats.map(() => ' ---- ').join('|')}|`);

for (let board in data.store) {
	const { releases } = data.store[board];

	const row = [];

	row.push(board);

	const links = [];

	for (let [release] of Object.entries(releases)) {
		links.push(`[${release}](/api/download?board=${board}&release=${release})`);
	}

	row.push(links.join(' '));

	row.push(consts.boards[board].join(', '));

	extend.push(`|${row.map(col => ` ${col} `).join('|')}|`);
}

data.close();

const recoveryTable = extend.join('\n');

await rm('build', { force: true, recursive: true });
await mkdir('build');

await copy('public', 'build', {
	dereference: true,
});

const index = await readFile('build/index.html', 'utf-8');

const markdownBody = marked.parse(
	(await readFile('assets/instructions.md', 'utf8')).replace(
		'RECOVERY_IMAGES',
		recoveryTable
	)
);

await writeFile(
	'build/index.html',
	index.replace(/<markdown-body\s*?\/>/g, markdownBody)
);
