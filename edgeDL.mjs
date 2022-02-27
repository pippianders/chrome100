'use strict';

import fetch from 'node-fetch';
import { readConsts, writeConsts } from './consts.mjs';

const consts = await readConsts();
const recovery = await fetch('https://dl.google.com/dl/edgedl/chromeos/recovery/recovery.json');
const data = await recovery.json();

for(let { chrome_version, version, file } of data){
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
	
	if(!consts.boards.includes(board)){
		consts.boards.push(board);
	}

	if(release in consts.versions){
		if(consts.versions[release].includes(version)){
			continue;
		}
		
		consts.versions[release].push(version);
	}else{
		consts.versions[release] = [ version ];
	}
}

consts.keys = consts.keys.sort((a, b) => a - b);

await writeConsts(consts);