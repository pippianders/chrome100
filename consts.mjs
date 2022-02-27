
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const file = join(__dirname, 'consts.json');

export async function readConsts(){
	const buffer = await readFile(file);
	return JSON.parse(buffer);
}

export async function writeConsts(data){
	await writeFile(file, JSON.stringify(data, null, '\t'));
}