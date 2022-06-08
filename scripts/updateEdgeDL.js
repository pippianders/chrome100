import fetch from 'node-fetch';
import { readConsts, writeConsts } from '../consts.js';

const consts = await readConsts();

console.log('Requesting recovery data...');
const recovery = await fetch(
	'https://dl.google.com/dl/edgedl/chromeos/recovery/recovery.json'
);
const data = await recovery.json();
console.log('Success. Received', data.length, 'entries');

console.log('Processing data...');

const new_models = [];
const new_boards = [];
const new_firmware = [];
const new_versions = [];

for (let { chrome_version, version, file, model } of data) {
	const release = chrome_version.slice(0, chrome_version.indexOf('.'));
	const match = file.match(
		/_(\w+)_recovery_stable-channel_mp(?:-v(\d+))?\.bin$/
	);

	if (!match) {
		continue;
	}

	let [, board, firmware] = match;

	firmware = parseInt(firmware);

	if (!isNaN(firmware)) {
		if (!consts.keys.includes(firmware)) {
			consts.keys.push(firmware);
			new_firmware.push(firmware);
		}
	}

	if (!(board in consts.boards)) {
		consts.boards[board] = [];
		new_boards.push(board);
	}

	if (model !== 'N/A') {
		if (!consts.boards[board].includes(model)) {
			consts.boards[board].push(model);
			new_models.push(model);
		}
	}

	if (!(release in consts.versions)) {
		consts.versions[release] = [];
	}

	if (!consts.versions[release].includes(version)) {
		consts.versions[release].push(version);
		new_versions.push(version);
	}
}

consts.keys = consts.keys.sort((a, b) => a - b);

console.log('Successfully loaded edge DL data.');
console.log('Found:');
console.log('\t', new_boards.length, 'new boards');
console.log('\t', new_firmware.length, 'new firmwares');
console.log('\t', new_models.length, 'new models');
console.log('\t', new_versions.length, 'new versions');

await writeConsts(consts);
