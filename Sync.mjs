'use strict';

import fetch from 'node-fetch';
import { Agent } from 'node:https';
import { readConsts } from './consts.mjs';

const consts = await readConsts();

export default class Sync {
	sort_by_hits = consts.keys;
	key_hits = {};
	constructor(data){
		this.data = data;
		this.agent = new Agent({ maxSockets: 100, keepAlive: true });
	}
	url(board, code, key){
		return 'https://dl.google.com/dl/edgedl/chromeos/recovery/chromeos_' + code + '_' + board + '_recovery_stable-channel_mp' + (key ? '-v' + key : '') + '.bin.zip';
	}
	async run(){
		await this.data.store;
		
		for(let board in consts.boards){
			const version_promises = [];
			
			for(let release in consts.versions){
				const versions = consts.versions[release];
				
				if(!(board in this.data.store)){
					this.data.store[board] = {
						processed: {},
						releases: {},
					};
				}
				
				let sboard = this.data.store[board];
				
				// run all versions concurrently
				for(let code of versions){
					if(!sboard.processed[code])sboard.processed[code] = [];
					
					const key_promises = [];
					
					for(let key of this.sort_by_hits){
						if(sboard.processed[code].includes(key))continue;
						
						const url = this.url(board, code, key);
						
						key_promises.push((async () => {
							try{
								// console.time(url);
								
								const res = await fetch(url, {
									method: 'HEAD',
									agent: this.agent,
								});
								
								// console.timeEnd(url);
								
								if(res.ok){
									console.log('Found DL:', board, release, url);
									
									this.key_hits[key] = (this.key_hits[key] || 0) + 1;
									sboard.releases[release] = { key, code };
									this.sort_by_hits = keys.sort((key1, key2) => (this.key_hits[key2] || 1) - (this.key_hits[key1] || 1));
									this.data.change();
								}else{
									if(res.status != 404)console.error('Encountered', res.status);
								}
							}catch(err){
								console.error(err);
								
								sboard.processed[code].push(key);
								this.data.change();
								
								return;
							}
							
							sboard.processed[code].push(key);
							this.data.change();
						})());
					}
					
					if(!key_promises.length)continue;
					version_promises.push(key_promises);
					if(version_promises.length >= 20){ // ~30(keys) * x; x=8 MAX 120 REQUESTS CONCURRENT
						const x = `run batch of ${version_promises.length} promises, in batches: ${version_promises.map(p=>p.length)}`;
						console.time(x);
						await Promise.all(version_promises.flat());
						version_promises.length = 0;
						console.timeEnd(x);
					}
				}
			}
			
			await Promise.all(version_promises);
		}
	}
};