// (hubToOutdoorPlan converts any walled family; scripts/hub-outdoor-survey.mjs shows which live seeds walk clean before you freeze one.)
// Freeze the accepted plan of one walled-hub seed into src/env/hubPlans/<name>.json, with its provenance (`frozen`): the 3D map reads the frozen copy, never the
// generator (env/planGenHub.js is under review and may change). Never run automatically.
//   node scripts/hub-freeze.mjs --seed 21 [--name lychgate-s21] [--why "the layout the user picked"]
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const seed = Number(arg('seed', 21));
const name = arg('name', `lychgate-s${seed}`);
const why = arg('why', `hub seed ${seed}, frozen so later generator edits never move it`);
const out = path.join(root, 'src/env/hubPlans', `${name}.json`);
if (existsSync(out) && !process.argv.includes('--force')) throw new Error(`${out} exists (a frozen plan never changes; pass --force to replace it)`);

const src = path.join(root, 'src/env/planGenHub.js');
const { buildCatalog } = await import(pathToFileURL(path.join(root, 'src/env/biomeCatalog.js')).href);
const { generateHubMap } = await import(pathToFileURL(src).href);
const catalog = buildCatalog({ sizes: JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8')) });
const map = generateHubMap(seed, catalog);
if (!map.ok) throw new Error(`generateHubMap(${seed}) is not ok (waived: ${map.waived?.map((w) => w.id).join(', ')})`);
const plan = { ...map.plan, frozen: { from: 'lookdev-lab/src/env/planGenHub.js', generator: map.plan.meta?.generator, codeSha256_16: createHash('sha256').update(readFileSync(src)).digest('hex').slice(0, 16), at: new Date().toISOString(), why } };
writeFileSync(out, JSON.stringify(plan, (k, v) => (typeof v === 'function' ? undefined : v), 1));
console.log(`froze seed ${seed} (${plan.masses.length} masses) → ${path.relative(root, out)}`);
