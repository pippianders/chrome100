'use strict';

const
	fs = require('fs'),
	path = require('path'),
	fetch = require('node-fetch'),
	consts = require('../consts.json');

async function main(){
	const data = await(await fetch('https://dl.google.com/dl/edgedl/chromeos/recovery/recovery.json')).json();
	
	for(let [ release, version ] of Object.entries(consts.versions))consts.versions[release] = [].concat(version);
	
	for(let entry of data){
		const release = ~~entry.chrome_version.split('.')[0];
		
		let [ match, version, board, firmware ] = entry.url.match(/chromeos_([\d.]+)_(\w+)_recovery_stable-channel_mp(?:-v(\d+))?\.bin\.zip$/) || [];
		
		if(!match)continue;
		
		firmware = parseInt(firmware);
		
		if(!isNaN(firmware)){
			if(!consts.keys.includes(firmware))consts.keys.push(firmware);
		}
		
		if(!consts.boards.includes(board))consts.boards.push(board);
		
		if(consts.versions[release]){
			if(consts.versions[release].includes(version))continue;
			
			consts.versions[release].push(version);
		}else consts.versions[release] = [ version ];
	}

	consts.keys = consts.keys.sort((a,b)=>a-b);

	await fs.promises.writeFile(path.join(__dirname, '..', 'consts.json'), JSON.stringify(consts, null, '\t'));
}

main();