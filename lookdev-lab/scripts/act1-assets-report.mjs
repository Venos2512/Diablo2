// ASHLAR · Act I base maps — the missing-asset report (SPEC §1.8, §6b): imports every map file in src/env/act1/maps/ (outdoor and interior engines alike)
// and writes docs/act1-base/ASSETS.md: a summary per map, then per map its assets (id, name, category, size, count, status, source, segment, note), what is
// still missing (status ≠ glb), monsters, NPCs, textures (have / lacks) and VFX, and a cross-map table of asset ids. Any task may run it; it regenerates from
// all maps. Usage: node scripts/act1-assets-report.mjs [--stdout]
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'src/env/act1/maps');
const outFile = path.join(root, 'docs/act1-base/ASSETS.md');
/** SPEC §0 order (map number), then any other file alphabetically. */
const ORDER = ['lychgate', 'fens', 'poppyReach', 'gentleHouse', 'gardenOfHush', 'cradle'];
const STATUS_VI = { glb: 'glb (model ASHLAR thật)', kit: 'kit tạm (kit cũ đứng thay)', procedural: 'procedural (code tạo tạm)', blockout: 'blockout (khối thay thế)' };
const sceneId = (id) => `act1${id[0].toUpperCase()}${id.slice(1)}`;
const esc = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const size = (s) => (Array.isArray(s) ? s.map((v) => +Number(v).toFixed(2)).join(' × ') : esc(s));
const have = (v) => (v === true ? 'có' : v === false ? '**thiếu**' : esc(v));

const files = readdirSync(mapsDir).filter((f) => f.endsWith('.js'));
files.sort((a, b) => {
	const ia = ORDER.indexOf(a.replace(/\.js$/, ''));
	const ib = ORDER.indexOf(b.replace(/\.js$/, ''));
	return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
});

const maps = [];
for (const f of files) {
	const id = f.replace(/\.js$/, '');
	try {
		const mod = await import(pathToFileURL(path.join(mapsDir, f)).href);
		const plan = mod.PLAN ?? mod.MAP ?? {};
		maps.push({ id, file: f, mod, plan, label: plan.label ?? plan.name ?? id, engine: plan.engine ?? '?', biome: plan.biome ?? '' });
	} catch (error) {
		maps.push({ id, file: f, error: error.message });
	}
}

const L = [];
const now = new Date().toISOString().slice(0, 10);
L.push('# ASHLAR · Act I · base maps — asset report');
L.push('');
L.push(`Sinh tự động bởi \`scripts/act1-assets-report.mjs\` (${now}) từ mọi file \`src/env/act1/maps/*.js\` (hợp đồng SPEC §6b). **Đừng sửa tay** — sửa file map rồi chạy lại \`node scripts/act1-assets-report.mjs\`.`);
L.push('');
L.push('Trạng thái: **glb** = model ASHLAR thật · **kit** = kit Blood-Moor cũ đứng thay ("kit tạm", chưa xong) · **procedural** = code tạo tạm (thẻ cỏ/lau, nước, sprig…) · **blockout** = khối thay thế đúng cỡ, model còn thiếu. "Còn thiếu" = mọi asset có trạng thái khác glb. Số lượng = số đặt trong base map (bản cắt đầu, chưa phải độ dài đầy đủ).');
L.push('');
L.push('## Tóm tắt');
L.push('');
L.push('| # | Map | Scene | Engine | Mã asset | Đặt | glb | kit | procedural | blockout | Quái (mã) | NPC | Texture thiếu | VFX thiếu |');
L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
maps.forEach((m, i) => {
	if (m.error) {
		L.push(`| ${i + 1} | \`${m.id}\` | — | — | lỗi: ${esc(m.error)} | | | | | | | | | |`);
		return;
	}
	const A = m.mod.ASSETS ?? [];
	const by = (st) => A.filter((a) => a.status === st).length;
	const placed = A.reduce((n, a) => n + (Number(a.count) || 0), 0);
	const tLack = (m.mod.TEXTURES ?? []).filter((t) => t.have !== true).length;
	const vLack = (m.mod.VFX ?? []).filter((v) => v.have !== true).length;
	L.push(`| ${i + 1} | ${esc(m.label)} (\`${m.id}\`) | \`${sceneId(m.id)}\` | ${m.engine} | ${A.length} | ${placed} | ${by('glb')} | ${by('kit')} | ${by('procedural')} | **${by('blockout')}** | ${(m.mod.MONSTERS ?? []).length} | ${(m.mod.NPCS ?? []).length} | ${tLack} | ${vLack} |`);
});
L.push('');

for (const m of maps) {
	if (m.error) continue;
	const { mod } = m;
	const A = mod.ASSETS ?? [];
	L.push(`## ${esc(m.label)} — \`${m.id}\``);
	L.push('');
	L.push(`Scene \`${sceneId(m.id)}\` · engine ${m.engine} · ${esc(m.biome)} · file \`src/env/act1/maps/${m.file}\`${m.plan.target ? ` · độ dài đề xuất: ${esc(m.plan.target.length)} m — ${esc(m.plan.target.note)}` : ''}`);
	L.push('');
	const counts = {};
	for (const a of A) counts[a.status] = (counts[a.status] ?? 0) + 1;
	L.push(`Mã asset: ${A.length} — ${Object.entries(STATUS_VI).map(([k, v]) => `${v}: **${counts[k] ?? 0}**`).join(' · ')}.`);
	L.push('');
	L.push('### Asset');
	L.push('');
	L.push('| Mã | Tên | Loại | Cỡ (m) R × C × S | Số | Trạng thái | Nguồn | Đoạn | Ghi chú |');
	L.push('|---|---|---|---|---|---|---|---|---|');
	for (const a of A) L.push(`| \`${esc(a.id)}\` | ${esc(a.name)} | ${esc(a.category)} | ${size(a.size)} | ${esc(a.count)} | ${a.status === 'glb' ? 'glb' : `**${esc(a.status)}**`}${a.model ? ` (\`${esc(a.model)}\`)` : ''} | ${esc(a.source)} | ${esc(a.segment)} | ${esc(a.note)}${a.placed === false ? ` · chưa đặt: ${esc(a.reason)}` : ''} |`);
	L.push('');
	const missing = A.filter((a) => a.status !== 'glb');
	L.push(`### Còn thiếu (${missing.length})`);
	L.push('');
	for (const st of ['blockout', 'procedural', 'kit']) {
		const list = missing.filter((a) => a.status === st);
		if (list.length) L.push(`- **${STATUS_VI[st]}** (${list.length}): ${list.map((a) => `\`${a.id}\` ${a.name}${a.count ? ` ×${a.count}` : ''}`).join(' · ')}`);
	}
	L.push('');
	L.push('### Quái');
	L.push('');
	if ((mod.MONSTERS ?? []).length) {
		L.push('| Mã | Tên | Đoạn | Số | Ghi chú |');
		L.push('|---|---|---|---|---|');
		for (const q of mod.MONSTERS) L.push(`| \`${esc(q.id)}\` | ${esc(q.name)} | ${esc(q.segment)} | ${esc(q.count)} | ${esc(q.note)} |`);
	} else L.push('— (không có)');
	L.push('');
	L.push('### NPC');
	L.push('');
	if ((mod.NPCS ?? []).length) for (const q of mod.NPCS) L.push(`- **${esc(q.name)}** (${esc(q.segment)}) — ${esc(q.note)}`);
	else L.push('— (không có)');
	L.push('');
	L.push('### Texture');
	L.push('');
	L.push('| Texture | Có | Ghi chú |');
	L.push('|---|---|---|');
	for (const t of mod.TEXTURES ?? []) L.push(`| ${esc(t.id)} | ${have(t.have)} | ${esc(t.note)} |`);
	L.push('');
	L.push('### VFX');
	L.push('');
	L.push('| Hiệu ứng | Có | Ghi chú |');
	L.push('|---|---|---|');
	for (const v of mod.VFX ?? []) L.push(`| ${esc(v.id)} | ${have(v.have)} | ${esc(v.note)} |`);
	L.push('');
}

// cross-map table
const ids = new Map();
for (const m of maps) {
	if (m.error) continue;
	for (const a of m.mod.ASSETS ?? []) {
		if (!ids.has(a.id)) ids.set(a.id, { name: a.name, uses: [] });
		ids.get(a.id).uses.push(`\`${m.id}\` ${a.status}${a.count ? ` ×${a.count}` : ''}`);
	}
}
L.push('## Bảng chéo mã asset (mọi map)');
L.push('');
L.push('| Mã | Tên | Dùng ở (trạng thái × số) |');
L.push('|---|---|---|');
const key = (id) => id.replace(/^([A-Z]+)(\d+)/, (_, p, n) => `${p}${n.padStart(3, '0')}`);
for (const [id, v] of [...ids.entries()].sort((a, b) => key(a[0]).localeCompare(key(b[0]), 'en', { numeric: true }))) L.push(`| \`${esc(id)}\` | ${esc(v.name)} | ${v.uses.join(' · ')} |`);
L.push('');

const text = L.join('\n');
if (process.argv.includes('--stdout')) console.log(text);
else {
	mkdirSync(path.dirname(outFile), { recursive: true });
	writeFileSync(outFile, text);
	console.log(`${path.relative(root, outFile)}: ${maps.length} map files (${maps.filter((m) => m.error).length} failed), ${ids.size} asset ids`);
}
