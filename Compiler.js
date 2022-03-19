import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readConsts } from './consts.js';

const consts = await readConsts();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import webpack from 'webpack';
import { marked } from 'marked';
import ExtractCSS from 'mini-css-extract-plugin';
import HTML from 'html-webpack-plugin';

export default class Compiler {
	assets = join(__dirname, 'assets');
	web = join(__dirname, 'public');
	md = join(this.assets, 'index.md');
	remove = /(<!-- REMOVE -->)[\s\S]*?\1/g;
	public_folder = /public\//g;
	markdown(code){
		return `<div class='markdown-body'>${marked.parse(code.toString().replace(this.public_folder, '').replace(this.remove, ''))}</div>`;
	}
	constructor(data){
		this.data = data;

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
		var cats = [ 'Board', 'Releases', 'Models' ],
			extend = [];
		
		extend.push(`|${cats.map(this.padding).join('|')}|`);
		extend.push(`|${cats.map(x => ' ---- ').join('|')}|`);
		
		for(let board in this.data.store){
			const { releases } = this.data.store[board];

			const data = [];
			
			data.push(board);

			const links = [];
			
			for(let [ release, { key, code } ] of Object.entries(releases)){
				links.push(`[${release}](/download?board=${board}&release=${release})`);
			}
			
			data.push(links.join(' '));

			data.push(consts.boards[board].join(', '));
			
			extend.push(`|${data.map(this.padding).join('|')}|`);
		}
		
		return extend.join('\n');
	}
};