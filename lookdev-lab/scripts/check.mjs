// Static checks (no browser needed): bundle builds, every registry effect exists in both GLSL and TSL,
// GLSL files avoid reserved words and reversed smoothstep edges, sample assets and credits are present.
// Usage: npm run check
import * as esbuild from 'esbuild';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleOptions } from './esbuild-plugins.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const warnings = [];
const ok = (msg) => console.log(`  ✓ ${msg}`);

// GLSL ES 3.00 reserved words that are easy to use by accident as variable names.
const RESERVED = ['active', 'input', 'output', 'sample', 'filter', 'common', 'partition', 'superp', 'namespace', 'using', 'half', 'fixed',
	'unsigned', 'cast', 'external', 'interface', 'long', 'short', 'double', 'packed', 'resource', 'union', 'enum', 'typedef', 'template',
	'this', 'goto', 'inline', 'noinline', 'volatile', 'public', 'static', 'extern', 'asm', 'class', 'sizeof', 'hvec2', 'hvec3', 'hvec4',
	'fvec2', 'fvec3', 'fvec4', 'image1D', 'image2D', 'noperspective', 'row_major', 'texture', 'smooth'];

async function walk(dir) {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await walk(p)));
		else out.push(p);
	}
	return out;
}

console.log('Bundle');
try {
	const result = await esbuild.build({ ...bundleOptions(root, { dev: false }), write: false, outdir: path.join(root, '.check') });
	ok(`bundle builds (${(result.outputFiles.reduce((n, f) => n + f.contents.length, 0) / 1048576).toFixed(2)} MB)`);
} catch (error) {
	problems.push(`bundle failed: ${error.message}`);
}

console.log('Effects (GLSL ↔ TSL parity)');
const registry = await readFile(path.join(root, 'src/effects/registry.js'), 'utf8');
const effectNames = [...registry.matchAll(/^\t(\w+): \{\n\t\tlabel:/gm)].map((m) => m[1]);
const glslImpl = await readFile(path.join(root, 'src/backends/webgl/effects.js'), 'utf8');
const tslImpl = await readFile(path.join(root, 'src/backends/webgpu/effects.js'), 'utf8');
for (const name of effectNames) {
	const inGlsl = glslImpl.includes(`// #region ${name}\n`);
	const inTsl = tslImpl.includes(`// #region ${name}\n`);
	if (!inGlsl || !inTsl) problems.push(`effect "${name}" missing in ${!inGlsl ? 'GLSL' : ''}${!inGlsl && !inTsl ? ' and ' : ''}${!inTsl ? 'TSL' : ''}`);
}
ok(`${effectNames.length} effects: ${effectNames.join(', ')}`);

console.log('GLSL sources');
const glslFiles = (await walk(path.join(root, 'src/shaders'))).filter((f) => f.endsWith('.glsl'));
for (const file of glslFiles) {
	const rel = path.relative(root, file);
	const code = (await readFile(file, 'utf8')).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
	for (const word of RESERVED) {
		const decl = new RegExp(`\\b(?:float|int|vec[234]|ivec[234]|bool|mat[234]|uint)\\s+${word}\\b`);
		if (decl.test(code)) problems.push(`${rel}: "${word}" is a reserved word in GLSL ES 3.00`);
	}
	for (const m of code.matchAll(/smoothstep\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,/g)) {
		if (Number(m[1]) >= Number(m[2])) problems.push(`${rel}: smoothstep( ${m[1]}, ${m[2]}, … ) has reversed edges (undefined in GLSL)`);
	}
	const opens = (code.match(/\{/g) || []).length;
	const closes = (code.match(/\}/g) || []).length;
	if (opens !== closes) problems.push(`${rel}: unbalanced braces (${opens} { vs ${closes} })`);
}
ok(`${glslFiles.length} files scanned`);

console.log('TSL sources');
for (const file of (await walk(path.join(root, 'src/backends/webgpu'))).filter((f) => f.endsWith('.js'))) {
	const rel = path.relative(root, file);
	const code = await readFile(file, 'utf8');
	// An If() callback with an expression body returns a node, which TSL turns into a (dropped) return.
	for (const m of code.matchAll(/(?:If|ElseIf)\([^\n]*?,\s*\(\)\s*=>(?!\s*\{)([^\n]+)/g)) problems.push(`${rel}: If callback with an expression body (use a block): ${m[0].slice(0, 80)}`);
	for (const m of code.matchAll(/smoothstep\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,/g)) {
		if (Number(m[1]) >= Number(m[2])) problems.push(`${rel}: smoothstep(${m[1]}, ${m[2]}, …) has reversed edges`);
	}
	// Additive VFX output has alpha 0, which the colorNode path of transparent node materials discards.
	for (const m of code.matchAll(/const (\w+) = new THREE\.\w*NodeMaterial\(\{[^}]*premultipliedAdditive[^}]*\}\)/g)) {
		if (new RegExp(`\\b${m[1]}\\.colorNode\\s*=`).test(code)) problems.push(`${rel}: premultiplied additive material "${m[1]}" uses colorNode (alpha 0 is discarded) — use fragmentNode`);
	}
}
ok('If() callbacks, smoothstep edges, additive materials');

console.log('Assets');
const samples = JSON.parse(await readFile(path.join(root, 'src/assets/samples.json'), 'utf8')).assets;
for (const s of samples) {
	try {
		await stat(path.join(root, 'assets', s.file));
	} catch {
		problems.push(`sample "${s.id}" file missing: assets/${s.file}`);
	}
	for (const key of ['license', 'credit', 'source']) if (!s[key]) problems.push(`sample "${s.id}" has no ${key}`);
}
ok(`${samples.length} samples with credits`);
try {
	const third = await readFile(path.join(root, 'THIRD_PARTY_LICENSES.md'), 'utf8');
	for (const s of samples) if (!third.includes(s.name)) warnings.push(`THIRD_PARTY_LICENSES.md does not mention "${s.name}"`);
} catch {
	warnings.push('THIRD_PARTY_LICENSES.md is missing');
}

console.log('');
for (const w of warnings) console.log(`  ! ${w}`);
if (problems.length) {
	for (const p of problems) console.log(`  ✗ ${p}`);
	console.log(`\n${problems.length} problem(s).`);
	process.exit(1);
}
console.log('All checks passed.');
