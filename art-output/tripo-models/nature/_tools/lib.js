// Helpers injected before each step script (concatenated by step.sh). Copy of ../../_tools/lib.js; clickButton waits
// for its button to appear (the generate page renders a few seconds after navigation).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
function findButton(re) {
	return [...document.querySelectorAll('button')].find((b) => re.test(norm(b.textContent)) && !b.disabled);
}
async function clickButton(re, wait = 1500, appear = 30000) {
	const t0 = Date.now();
	let b;
	while (!(b = findButton(re)) && Date.now() - t0 < appear) await sleep(500);
	if (!b) throw new Error('button not found: ' + re);
	b.click();
	await sleep(wait);
	return norm(b.textContent);
}
function clickLeaf(text) {
	const el = [...document.querySelectorAll('span,div,p')].find((e) => e.children.length === 0 && norm(e.textContent) === text);
	if (!el) throw new Error('text not found: ' + text);
	el.click();
	return text;
}
async function waitUntil(fn, timeoutMs, stepMs = 2000) {
	const t0 = Date.now();
	while (Date.now() - t0 < timeoutMs) {
		if (fn()) return Math.round((Date.now() - t0) / 1000);
		await sleep(stepMs);
	}
	throw new Error('timeout');
}
const bodyText = () => document.body.innerText;
