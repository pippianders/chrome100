import { readConsts, writeConsts } from '../consts.js';
import fetch from 'node-fetch';

const consts = await readConsts();

console.log('Requesting recovery data...');
const recovery = await fetch(
  'https://dl.google.com/dl/edgedl/chromeos/recovery/recovery.json'
);
const data = await recovery.json();
console.log('Success. Received', data.length, 'entries');

console.log('Processing data...');

const newModels = [];
const newBoards = [];
const newFirmware = [];
const newVersions = [];

for (const { chrome_version: chromeVersion, version, file, model } of data) {
  const release = chromeVersion.slice(0, chromeVersion.indexOf('.'));
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
      newFirmware.push(firmware);
    }
  }

  if (!(board in consts.boards)) {
    consts.boards[board] = [];
    newBoards.push(board);
  }

  if (model !== 'N/A') {
    if (!consts.boards[board].includes(model)) {
      consts.boards[board].push(model);
      newModels.push(model);
    }
  }

  if (!(release in consts.versions)) {
    consts.versions[release] = [];
  }

  if (!consts.versions[release].includes(version)) {
    consts.versions[release].push(version);
    newVersions.push(version);
  }
}

consts.keys = consts.keys.sort((a, b) => a - b);

console.log('Successfully loaded edge DL data.');
console.log('Found:');
console.log('\t', newBoards.length, 'new boards');
console.log('\t', newFirmware.length, 'new firmwares');
console.log('\t', newModels.length, 'new models');
console.log('\t', newVersions.length, 'new versions');

await writeConsts(consts);
