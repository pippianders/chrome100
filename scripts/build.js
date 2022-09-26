import DataStore from '../DataStore.js';
import {
	appBuild,
	appData,
	appHtml,
	appIndexJs,
	appMd,
	appPublic,
} from '../config/paths.js';
import { readConsts } from '../consts.js';
import fs from 'fs-extra';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { marked } from 'marked';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';

const consts = await readConsts();

const data = new DataStore(appData);

function recovery_table() {
	const cats = ['Board', 'Releases', 'Models'];
	const extend = [];

	extend.push(`|${cats.map(cat => ` ${cat} `).join('|')}|`);
	extend.push(`|${cats.map(x => ' ---- ').join('|')}|`);

	for (let board in data.store) {
		const { releases } = data.store[board];

		const row = [];

		row.push(board);

		const links = [];

		for (let [release] of Object.entries(releases)) {
			links.push(
				`[${release}](/api/download?board=${board}&release=${release})`
			);
		}

		row.push(links.join(' '));

		row.push(consts.boards[board].join(', '));

		extend.push(`|${row.map(col => ` ${col} `).join('|')}|`);
	}

	return extend.join('\n');
}

await fs.emptyDir(appBuild);

await fs.copy(appPublic, appBuild, {
	dereference: true,
	filter: file => file !== appHtml,
});

const compiler = webpack({
	entry: appIndexJs,
	output: {
		path: appBuild,
		filename: 'main.js',
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: appHtml,
			templateParameters: {
				markdown: marked.parse(
					(await fs.readFile(appMd, 'utf8')).replace(
						'RECOVERY_IMAGES',
						recovery_table()
					)
				),
			},
		}),
		new MiniCssExtractPlugin(),
	],
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
			{
				test: /\.(svg|gif|png|eot|woff|ttf)$/,
				use: ['url-loader'],
			},
		],
	},
});

data.close();

compiler.run((error, stats) => {
	const errors = [error, ...stats.compilation.errors].filter(Boolean);

	for (let error of errors) {
		console.error(error);
	}
});
