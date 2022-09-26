import { readFile, writeFile } from 'node:fs/promises';

export async function readConsts() {
	const buffer = await readFile('bin/consts.json');
	return JSON.parse(buffer);
}

export async function writeConsts(data) {
	await writeFile('bin/consts.json', JSON.stringify(data, null, '\t'));
}
