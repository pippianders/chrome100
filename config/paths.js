import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

const appDirectory = await realpath(cwd());

export function resolveApp(relativePath) {
	return resolve(appDirectory, relativePath);
}

export const appAssets = resolveApp('assets');
export const appSrc = resolveApp('src');
export const appIndexJs = resolveApp('src/index.js');
export const appMd = resolveApp('src/index.md');
export const appPublic = resolveApp('public');
export const appBuild = resolveApp('build');
export const appHtml = resolveApp('public/index.html');
export const appData = resolveApp('bin/data.json');
export const appConsts = resolveApp('bin/consts.json');
