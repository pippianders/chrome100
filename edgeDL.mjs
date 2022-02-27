import fetch from 'node-fetch';
import { readConsts, writeConsts } from './consts.mjs';

const consts = await readConsts();
const recovery = await fetch('https://dl.google.com/dl/edgedl/chromeos/recovery/recovery.json');
const data = await recovery.json();

for(let { chrome_version, version, file, model } of data){
	const release = chrome_version.slice(0, chrome_version.indexOf('.'));
	const match = file.match(/_(\w+)_recovery_stable-channel_mp(?:-v(\d+))?\.bin$/);
	
	if(!match){
		continue;
	}

	let [,board,firmware] = match;

	firmware = parseInt(firmware);
	
	if(!isNaN(firmware)){
		if(!consts.keys.includes(firmware)){
			consts.keys.push(firmware);
		}
	}
	
	if(!(board in consts.boards)){
		consts.boards[board] = [];
	}

	if(model !== 'N/A'){
		if(!consts.boards[board].includes(model)){
			consts.boards[board].push(model);
		}	
	}
	
	if(!(release in consts.versions)){
		consts.versions[release] = [];
	}

	if(!consts.versions[release].includes(version)){
		consts.versions[release].push(version);
	}
}

consts.keys = consts.keys.sort((a, b) => a - b);

await writeConsts(consts);