import { appConsts } from './config/paths.js';
import { readFile, writeFile } from 'node:fs/promises';

export async function readConsts() {
	const buffer = await readFile(appConsts);
	return JSON.parse(buffer);
}

export async function writeConsts(data) {
	await writeFile(appConsts, JSON.stringify(data, null, '\t'));
}
