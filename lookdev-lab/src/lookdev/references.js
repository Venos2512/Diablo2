// Lookdev reference objects: 18% grey ball, chrome ball, ColorChecker-style 24 patch chart.
import * as THREE from 'three';

// Widely published sRGB approximations of the 24-patch ColorChecker Classic (row by row).
export const CHECKER_SRGB = [
	[115, 82, 68], [194, 150, 130], [98, 122, 157], [87, 108, 67], [133, 128, 177], [103, 189, 170],
	[214, 126, 44], [80, 91, 166], [193, 90, 99], [94, 60, 108], [157, 188, 64], [224, 163, 46],
	[56, 61, 150], [70, 148, 73], [175, 54, 60], [231, 199, 31], [187, 86, 149], [8, 133, 161],
	[243, 243, 242], [200, 200, 200], [160, 160, 160], [122, 122, 121], [85, 85, 85], [52, 52, 52],
];

export function createColorChecker() {
	const group = new THREE.Group();
	group.name = 'ColorChecker';
	const cols = 6;
	const rows = 4;
	const patch = 0.13;
	const gap = 0.022;
	const width = cols * patch + (cols + 1) * gap;
	const height = rows * patch + (rows + 1) * gap;

	const frame = new THREE.Mesh(
		new THREE.BoxGeometry(width, height, 0.012),
		new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.02, 0.02, 0.02), roughness: 0.75, name: 'Checker frame' }),
	);
	frame.castShadow = true;
	frame.receiveShadow = true;
	group.add(frame);

	const patches = new THREE.InstancedMesh(
		new THREE.PlaneGeometry(patch, patch),
		new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, name: 'Checker patches' }),
		cols * rows,
	);
	const m = new THREE.Matrix4();
	const color = new THREE.Color();
	CHECKER_SRGB.forEach(([r, g, b], i) => {
		const cx = i % cols;
		const cy = Math.floor(i / cols);
		m.makeTranslation(-width / 2 + gap + patch / 2 + cx * (patch + gap), height / 2 - gap - patch / 2 - cy * (patch + gap), 0.0065);
		patches.setMatrixAt(i, m);
		patches.setColorAt(i, color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace));
	});
	patches.receiveShadow = true;
	group.add(patches);

	const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8), frame.material);
	leg.position.set(0, -height / 2 - 0.25, -0.02);
	leg.castShadow = true;
	group.add(leg);
	group.userData.height = height + 0.5;
	return group;
}

export function createBalls() {
	const group = new THREE.Group();
	group.name = 'Reference balls';
	const geometry = new THREE.SphereGeometry(0.17, 64, 32);
	// 18% reflectance grey (linear 0.18 = sRGB 118) and a near-perfect chrome.
	const grey = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.18, 0.18, 0.18), roughness: 0.92, metalness: 0, name: 'Grey ball 18%' }));
	const chrome = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.96, 0.96, 0.96), roughness: 0.03, metalness: 1, name: 'Chrome ball' }));
	grey.position.set(0, 0.17, 0.22);
	chrome.position.set(0, 0.17, -0.22);
	for (const ball of [grey, chrome]) {
		ball.castShadow = true;
		ball.receiveShadow = true;
		group.add(ball);
	}
	return group;
}

/** Procedural UV checker (CanvasTexture) used by the "UV checker" debug view. */
export function createUvChecker(size = 1024) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d');
	const n = 8;
	const cell = size / n;
	for (let y = 0; y < n; y++) {
		for (let x = 0; x < n; x++) {
			const hue = ((x + y * n) / (n * n)) * 360;
			ctx.fillStyle = (x + y) % 2 ? `hsl(${hue}, 45%, 62%)` : `hsl(${hue}, 35%, 30%)`;
			ctx.fillRect(x * cell, y * cell, cell, cell);
			ctx.fillStyle = 'rgba(255,255,255,0.9)';
			ctx.font = `${Math.round(cell * 0.28)}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(`${String.fromCharCode(65 + x)}${n - y}`, x * cell + cell / 2, y * cell + cell / 2);
		}
	}
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.lineWidth = 2;
	for (let i = 0; i <= n; i++) {
		ctx.beginPath();
		ctx.moveTo(i * cell, 0);
		ctx.lineTo(i * cell, size);
		ctx.moveTo(0, i * cell);
		ctx.lineTo(size, i * cell);
		ctx.stroke();
	}
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.anisotropy = 8;
	return texture;
}
