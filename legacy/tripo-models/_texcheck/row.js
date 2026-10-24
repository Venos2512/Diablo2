(async () => {
	const a = window.__LAB__.app;
	if (a.current.id !== 'studio') await a.setScene('studio', { keepCamera: false });
	const scene = a.world.scene;
	scene.getObjectByName('__kitrow')?.removeFromParent();
	scene.traverse((o) => { if (o.isMesh && o.visible && !o.userData.__kitrow) { o.userData.__hid = true; o.visible = false; } });
	const gltf = await a.loader.loadLibrary(KIT);
	const row = gltf.scene.clone(true);
	row.name = '__kitrow';
	const pieces = []; row.traverse((o) => o.isMesh && pieces.push(o));
	let x = 0;
	for (const p of pieces) {
		p.geometry.computeBoundingBox(); const b = p.geometry.boundingBox;
		p.position.set(x - b.min.x, 0, 0); p.rotation.set(0, 0, 0); p.scale.setScalar(1); x += b.max.x - b.min.x + 0.4;
		p.updateMatrix();
	}
	row.position.set(-x / 2, 0, 0); row.rotation.set(0, 0, 0); row.scale.setScalar(1);
	row.traverse((o) => { o.userData.__kitrow = true; o.visible = true; });
	scene.add(row);
	const c = a.rig.controls; c.target.set(0, 0.9, 0);
	a.rig.camera.position.set(0, 4.5, x * 0.75 + 2); a.rig.camera.lookAt(c.target); c.update();
	await new Promise((r) => setTimeout(r, 2000));
	return pieces.length + ' pieces, width ' + x.toFixed(1);
})()
