export async function load(url, context, nextLoad) {
	if (url.endsWith('.glsl')) return { format: 'module', shortCircuit: true, source: `export default { path: ${JSON.stringify(url)}, code: '' };` };
	if (/\.(webp|png|jpe?g|gif|svg)$/.test(url)) return { format: 'module', shortCircuit: true, source: `export default ${JSON.stringify(url)};` };
	return nextLoad(url, context);
}
