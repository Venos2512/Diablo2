// Texture forge: bakes tileable PBR texture sets (albedo, normal, ORM) from GLSL recipes on a small
// private WebGL2 context, then hands plain DataTextures to whichever renderer is active. Because the bake
// is renderer-independent, WebGL2 and WebGPU modes shade exactly the same texels.
// In dev mode, editing a recipe in src/shaders/forge re-bakes it live.
import * as THREE from 'three';
import prelude from '../shaders/forge/prelude.glsl';
import stoneBricks from '../shaders/forge/stone_bricks.glsl';
import cobblestone from '../shaders/forge/cobblestone.glsl';
import dirt from '../shaders/forge/dirt.glsl';
import grass from '../shaders/forge/grass.glsl';
import wood from '../shaders/forge/wood.glsl';
import iron from '../shaders/forge/iron.glsl';
import stoneWeathered from '../shaders/forge/stone_weathered.glsl';
import { onShaderChange } from '../core/shaderRegistry.js';

/** tile = metres covered by one texture repeat; relief = height scale used to derive the normal map. */
export const RECIPES = {
	stoneBricks: { entry: stoneBricks, label: 'Stone bricks', tile: 3.0, relief: 0.012, seed: 1 },
	cobblestone: { entry: cobblestone, label: 'Cobblestone', tile: 2.4, relief: 0.01, seed: 2 },
	dirt: { entry: dirt, label: 'Dirt', tile: 4.0, relief: 0.004, seed: 3 },
	grass: { entry: grass, label: 'Moor grass', tile: 5.0, relief: 0.003, seed: 4 },
	wood: { entry: wood, label: 'Weathered wood', tile: 1.6, relief: 0.006, seed: 5 },
	iron: { entry: iron, label: 'Rusted iron', tile: 1.0, relief: 0.004, seed: 6 },
	stoneWeathered: { entry: stoneWeathered, label: 'Weathered stone', tile: 1.6, relief: 0.006, seed: 7 },
};

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4( aPos, 0.0, 1.0 ); }`;

function fragmentSource(recipeCode) {
	return `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uSeed;
uniform int uMode;
uniform float uRelief;
out vec4 outColor;
${prelude.code}
${recipeCode}
float heightAt( vec2 uv ) {
	vec3 a; float h; float r; float o; float m;
	recipe( fract( uv ), a, h, r, o, m );
	return h;
}
void main() {
	vec2 uv = gl_FragCoord.xy / uRes;
	vec3 albedo; float h; float rough; float ao; float metal;
	recipe( uv, albedo, h, rough, ao, metal );
	if ( uMode == 0 ) {
		outColor = vec4( clamp( albedo, 0.0, 1.0 ), 1.0 );
	} else if ( uMode == 1 ) {
		vec2 t = 1.0 / uRes;
		float dx = ( heightAt( uv + vec2( t.x, 0.0 ) ) - heightAt( uv - vec2( t.x, 0.0 ) ) ) / ( 2.0 * t.x );
		float dy = ( heightAt( uv + vec2( 0.0, t.y ) ) - heightAt( uv - vec2( 0.0, t.y ) ) ) / ( 2.0 * t.y );
		vec3 n = normalize( vec3( - dx * uRelief, - dy * uRelief, 1.0 ) );
		outColor = vec4( n * 0.5 + 0.5, 1.0 );
	} else {
		outColor = vec4( clamp( ao, 0.0, 1.0 ), clamp( rough, 0.04, 1.0 ), clamp( metal, 0.0, 1.0 ), 1.0 );
	}
}`;
}

export class TextureForge {
	constructor({ size = 1024, anisotropy = 8 } = {}) {
		this.size = size;
		this.anisotropy = anisotropy;
		this.sets = new Map();
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.canvas.height = 1;
		const gl = this.canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false, depth: false });
		if (!gl) throw new Error('Texture forge needs WebGL2 (used only to bake procedural textures).');
		this.gl = gl;
		this.vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		this.target = gl.createTexture();
		this.fbo = gl.createFramebuffer();
		this.allocate(size);
		this.unsubscribe = onShaderChange((entry) => this.onShaderEdit(entry));
	}

	allocate(size) {
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.target);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.target, 0);
	}

	program(source) {
		const gl = this.gl;
		const compile = (type, src) => {
			const s = gl.createShader(type);
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				const log = gl.getShaderInfoLog(s);
				gl.deleteShader(s);
				throw new Error(`Forge shader error:\n${log}`);
			}
			return s;
		};
		const p = gl.createProgram();
		const vs = compile(gl.VERTEX_SHADER, VERT);
		const fs = compile(gl.FRAGMENT_SHADER, source);
		gl.attachShader(p, vs);
		gl.attachShader(p, fs);
		gl.bindAttribLocation(p, 0, 'aPos');
		gl.linkProgram(p);
		gl.deleteShader(vs);
		gl.deleteShader(fs);
		if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Forge link error: ${gl.getProgramInfoLog(p)}`);
		return p;
	}

	/** Bake (or re-bake in place) the set for `id`. Returns { map, normalMap, ormMap, recipe }. */
	bake(id) {
		const recipe = RECIPES[id];
		const gl = this.gl;
		const size = this.size;
		const program = this.program(fragmentSource(recipe.entry.code));
		gl.useProgram(program);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, size, size);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.uniform2f(gl.getUniformLocation(program, 'uRes'), size, size);
		gl.uniform1f(gl.getUniformLocation(program, 'uSeed'), recipe.seed);
		gl.uniform1f(gl.getUniformLocation(program, 'uRelief'), recipe.relief);
		const modeLoc = gl.getUniformLocation(program, 'uMode');

		let set = this.sets.get(id);
		const fresh = !set;
		if (fresh) set = { recipe, id };
		for (const [mode, key, colorSpace] of [[0, 'map', THREE.SRGBColorSpace], [1, 'normalMap', THREE.NoColorSpace], [2, 'ormMap', THREE.NoColorSpace]]) {
			gl.uniform1i(modeLoc, mode);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			const data = new Uint8Array(size * size * 4);
			gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, data);
			if (fresh) {
				const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
				tex.name = `${recipe.label} · ${key}`;
				tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
				tex.generateMipmaps = true;
				tex.minFilter = THREE.LinearMipmapLinearFilter;
				tex.magFilter = THREE.LinearFilter;
				tex.anisotropy = this.anisotropy;
				tex.colorSpace = colorSpace;
				tex.repeat.setScalar(1 / recipe.tile);
				tex.needsUpdate = true;
				set[key] = tex;
			} else {
				set[key].image.data = data;
				set[key].needsUpdate = true;
			}
		}
		gl.deleteProgram(program);
		this.sets.set(id, set);
		return set;
	}

	get(id) {
		return this.sets.get(id) || this.bake(id);
	}

	onShaderEdit(entry) {
		if (!entry.path.startsWith('shaders/forge/')) return;
		const isPrelude = entry.path.endsWith('prelude.glsl');
		for (const [id, set] of this.sets) {
			if (!isPrelude && RECIPES[id].entry !== entry) continue;
			try {
				this.bake(id);
				set.onRebake?.();
			} catch (error) {
				console.error(error);
				window.__LAB__?.app?.errors.text('forge', 'Texture recipe error', error.message);
				return;
			}
		}
		window.__LAB__?.app?.errors.remove('forge');
	}

	dispose() {
		this.unsubscribe?.();
		for (const set of this.sets.values()) for (const key of ['map', 'normalMap', 'ormMap']) set[key].dispose();
		this.gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
}

/** MeshStandardMaterial wired to a forged set (ORM packed: R = AO, G = roughness, B = metalness). */
export function forgedMaterial(forge, id, extra = {}) {
	const set = forge.get(id);
	return new THREE.MeshStandardMaterial({
		name: RECIPES[id].label,
		map: set.map,
		normalMap: set.normalMap,
		aoMap: set.ormMap,
		roughnessMap: set.ormMap,
		metalnessMap: set.ormMap,
		roughness: 1,
		metalness: 1,
		...extra,
	});
}
