// Quality presets. Applying one rewrites the matching post/shadow settings; each value stays editable.
export const QUALITY_PRESETS = {
	low: { label: 'Low (iGPU / mobile)', maxPixelRatio: 1, shadowMapSize: 1024, aa: 'fxaa', ao: false, aoResolution: 0.5, bloom: true, vfxResolution: 0.5 },
	medium: { label: 'Medium', maxPixelRatio: 1, shadowMapSize: 2048, aa: 'smaa', ao: true, aoResolution: 0.5, bloom: true, vfxResolution: 0.5 },
	high: { label: 'High', maxPixelRatio: 1.5, shadowMapSize: 2048, aa: 'smaa', ao: true, aoResolution: 0.5, bloom: true, vfxResolution: 1 },
	ultra: { label: 'Ultra (discrete GPU)', maxPixelRatio: 2, shadowMapSize: 4096, aa: 'msaa', ao: true, aoResolution: 1, bloom: true, vfxResolution: 1 },
};

export function applyQualityPreset(settings, id) {
	const q = QUALITY_PRESETS[id];
	if (!q) return;
	const s = settings.data;
	s.quality = id;
	s.post.aa = q.aa;
	s.post.ao.enabled = q.ao;
	s.post.ao.resolution = q.aoResolution;
	s.post.bloom.enabled = q.bloom;
	s.post.vfxResolution = q.vfxResolution;
	s.lighting.shadowMapSize = q.shadowMapSize;
	settings.changed('quality');
}
