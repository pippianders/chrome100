'use strict';

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import prism from 'prismjs';
import webpack from 'webpack';
import prism_load from 'prismjs/components/index.js';
import { marked } from 'marked';
import ExtractCSS from 'mini-css-extract-plugin';
import HTML from 'html-webpack-plugin';

prism_load([ 'json' ]);

marked.setOptions({
	highlight(code, lang){
		return prism.languages[lang] ? prism.highlight(code, prism.languages[lang], lang) : code;
	},
});

export default class Compiler {
	assets = join(__dirname, 'assets');
	web = join(__dirname, 'public');
	md = join(this.assets, 'index.md');
	remove = /(<!-- REMOVE -->)[\s\S]*?\1/g;
	public_folder = /public\//g;
	constructor(data){
		this.data = data;
	}
	markdown(code){
		return `<div class='markdown-body'>${marked.parse(code.toString().replace(this.public_folder, '').replace(this.remove, ''))}</div>`;
	}
	init(){
		this.webpack = webpack({
			entry: join(this.assets, 'entry.mjs'),
			context: __dirname,
			output: {
				path: this.web,
				filename: 'main.js',
			},
			plugins: [
				new HTML({
					template: join(this.assets, 'index.ejs'),
					templateParameters: {
						compiler: this,
					},
				}),
				new ExtractCSS()
			],
			module: {
				rules: [
					{
						test: /\.css$/,
						use: [
							ExtractCSS.loader,
							'css-loader',
						],
					},
					{
						test: /\.md$/i,
						type: 'json',
						parser: {
							parse: markdown => this.markdown(markdown),
						},

					},
					{
						test: /\.(svg|gif|png|eot|woff|ttf)$/,
						use: [
							'url-loader',
						],
					},
				],
			},
		});
		
		this.webpack.watch({}, async (err, stats) => {
			if(this.errors(err, stats))return console.error('Build failure');
			else console.log('Build success');
		});
	}
	errors(err, stats = { compilation: { errors: [] } }){
		var error = !!(err || stats.compilation.errors.length);
		
		for(var ind = 0; ind < stats.compilation.errors.length; ind++)error = true, console.error(stats.compilation.errors[ind]);
		
		if(err)console.error(err);
		
		return error;
	}
	padding(str){
		return ' ' + str + ' ';
	}
	recovery_table(){
		var cats = [ 'Board', 'Models', 'Releases' ],
			extend = [];
		
		extend.push(`|${cats.map(this.padding).join('|')}|`);
		extend.push(`|${cats.map(x => ' ---- ').join('|')}|`);
		
		for(let [ board, { releases } ] of Object.entries(this.data.store)){
			let data = [ board, 'N/A' ];
			
			let links = [];
			
			for(let [ release, { key, code } ] of Object.entries(releases)){
				links.push(`[${release}](/download?board=${board}&release=${release})`);
			}
			
			// break list of versions every ${split} values
			
			let out = '',
				split = 5;
			
			for(let index = 0; index < links.length; index += split){
				links.splice(index++ + split, 0, '<br>');
			}
			
			data.push(links.join(' '));
			
			extend.push(`|${data.map(this.padding).join('|')}|`);
		}
		
		return extend.join('\n');
	}
};