// ===== game part 06-camera-lighting-presets-postfx (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var sh, ch, lh, uh = t((() => {
  sh = { physical: `#e8dccb`, fire: `#ff6a1a`, cold: `#7fd4ff`, lightning: `#c9d8ff`, poison: `#6fbf3a`, magic: `#c070ff` }, ch = { low: `#8c8c8c`, normal: `#e8e3d6`, superior: `#e8e3d6`, magic: `#6b78ff`, rare: `#ffe14f`, set: `#3fd43f`, unique: `#c7a462`, crafted: `#ffa53a`, runeword: `#c7a462`, misc: `#e8e3d6` }, lh = { nightAmbient: `#1b2430`, moonlight: `#8fa6c8`, torch: `#ff9a4a`, blood: `#7a0d0d`, bone: `#d8ccb0`, iron: `#5b5f66`, goldTrim: `#c8a24a`, oxblood: `#5a0f0f`, moorGreen: `#3b4a2e`, moorOlive: `#59603d`, mud: `#2a2219`, stone: `#6b6a66`, champion: `#5d7cff`, unique: `#d8b04a`, ally: `#7fe0c8`, telegraph: `#ff2a1a` };
}));
uh();
var dh = Math.PI / 4, fh = 30 * Math.PI / 180, ph = 60;
function mh(e4, t2) {
  let n2 = Math.sin(e4 * 12.9898 + t2 * 78.233) * 43758.5453;
  return (n2 - Math.floor(n2)) * 2 - 1;
}
var hh = class {
  camera;
  back = new N();
  right = new N();
  up = new N();
  viewHeight = 14.5;
  zoom = 1;
  zoomTarget = 1;
  trauma = 0;
  time = 0;
  shakeEnabled = true;
  aspect = 16 / 9;
  target = new N();
  cinematic = null;
  cine = new N();
  cineBlend = 0;
  cineHeight = 14.5;
  constructor() {
    this.camera = new js(-1, 1, 1, -1, 0.5, 200), this.back.set(Math.sin(dh) * Math.cos(fh), Math.sin(fh), Math.cos(dh) * Math.cos(fh)).normalize(), this.camera.up.set(0, 1, 0), this.camera.position.copy(this.back).multiplyScalar(ph), this.camera.lookAt(0, 0, 0), this.camera.updateMatrixWorld(), this.right.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize(), this.up.setFromMatrixColumn(this.camera.matrixWorld, 1).normalize();
  }
  setAspect(e4) {
    this.aspect = e4;
  }
  addTrauma(e4) {
    this.shakeEnabled && (this.trauma = Math.min(1, this.trauma + e4));
  }
  wheelZoom(e4) {
    this.zoomTarget = im(this.zoomTarget + e4 * 0.07, 0.85, 1.25);
  }
  snap() {
    this.cinematic = null, this.cineBlend = 0, this.trauma = 0, this.zoom = this.zoomTarget;
  }
  snapZoom(e4) {
    this.zoomTarget = e4, this.zoom = e4;
  }
  update(e4, t2) {
    e4 = Math.max(0, Math.min(e4, 0.1)), this.time += e4, this.zoom = lm(this.zoom, this.zoomTarget, 10, e4);
    let n2 = this.cinematic !== null;
    this.cineBlend = lm(this.cineBlend, +!!n2, 3.2, e4), this.cinematic && (this.cine.copy(this.cinematic.target), this.cineHeight = this.cinematic.viewHeight), this.cineBlend < 1e-3 && this.cine.copy(t2), this.target.copy(t2).lerp(this.cine, this.cineBlend);
    let r2 = rr.lerp(this.viewHeight, this.cineHeight, this.cineBlend) * this.zoom / 2, i2 = r2 * this.aspect, a2 = this.camera;
    if (a2.left = -i2, a2.right = i2, a2.top = r2, a2.bottom = -r2, a2.position.copy(this.target).addScaledVector(this.back, ph), this.trauma = im(this.trauma - e4 * 1.6, 0, 1), this.trauma > 0) {
      let e5 = this.trauma * this.trauma, t3 = this.time * 30;
      a2.position.addScaledVector(this.right, 0.45 * e5 * mh(t3, 1)), a2.position.addScaledVector(this.up, 0.45 * e5 * mh(t3, 2));
    }
    a2.updateProjectionMatrix(), a2.updateMatrixWorld();
  }
  project(e4, t2, n2, r2) {
    let i2 = gh.copy(e4).project(this.camera);
    return r2.x = (i2.x * 0.5 + 0.5) * t2, r2.y = (-i2.y * 0.5 + 0.5) * n2, i2.z > -1 && i2.z < 1;
  }
  pickGround(e4, t2, n2, r2, i2, a2) {
    vh.set(e4 / n2 * 2 - 1, -(t2 / r2) * 2 + 1), yh.setFromCamera(vh, this.camera);
    let o2 = yh.ray.direction, s2 = yh.ray.origin;
    if (Math.abs(o2.y) < 1e-6) return false;
    let c2 = (i2 - s2.y) / o2.y;
    return a2.copy(s2).addScaledVector(o2, c2), true;
  }
  get rayDirection() {
    return _h.copy(this.back).negate();
  }
}, gh = new N(), _h = new N(), vh = new M(), yh = new $s();
Ed();
var bh = { town: { hemiSky: `#4d5d7c`, hemiGround: `#221c14`, hemiIntensity: 1.1, moonColor: `#a3b6d8`, moonIntensity: 1.9, heroColor: `#ffd9b0`, heroIntensity: 26, heroDistance: 15, envIntensity: 0.45, background: `#07090d` }, moor: { hemiSky: `#4a5d80`, hemiGround: `#1d1a14`, hemiIntensity: 1.2, moonColor: `#93abcf`, moonIntensity: 2.3, heroColor: `#ffe0bf`, heroIntensity: 40, heroDistance: 18, envIntensity: 0.45, background: `#05070a` }, fields: { hemiSky: `#525c78`, hemiGround: `#211b13`, hemiIntensity: 1.15, moonColor: `#a7b3cc`, moonIntensity: 2.2, heroColor: `#ffe0bf`, heroIntensity: 40, heroDistance: 18, envIntensity: 0.45, background: `#05070a` }, cave: { hemiSky: `#2c3848`, hemiGround: `#140f0b`, hemiIntensity: 1, moonColor: `#6a7c9c`, moonIntensity: 0.9, heroColor: `#ffd2a0`, heroIntensity: 52, heroDistance: 19, envIntensity: 0.32, background: `#020203` }, bloodmoon: { hemiSky: `#7a3030`, hemiGround: `#1a0c0a`, hemiIntensity: 1, moonColor: `#ff6a5a`, moonIntensity: 2, heroColor: `#ffd2a0`, heroIntensity: 34, heroDistance: 17, envIntensity: 0.35, background: `#0a0303` }, title: { hemiSky: `#334058`, hemiGround: `#120e0a`, hemiIntensity: 0.55, moonColor: `#8fa6c8`, moonIntensity: 0.9, heroColor: `#ffcf9a`, heroIntensity: 0, heroDistance: 14, envIntensity: 0.3, background: `#030406` } };
function xh(e4, t2) {
  return Math.sin(e4 * 7.3 + t2) * 0.5 + Math.sin(e4 * 13.1 + t2 * 2.1) * 0.3 + Math.sin(e4 * 23.7 + t2 * 3.7) * 0.2;
}
var Sh = class {
  scene;
  hemi;
  moon;
  hero;
  pool = [];
  emitters = /* @__PURE__ */ new Set();
  seedCounter = 1;
  moonOffset = new N(-12, 30, 22);
  heroFactor = 1;
  radiusBonus = 0;
  base = bh.moor;
  flash = 0;
  constructor(e4) {
    this.scene = e4, this.hemi = new gs(`#3d4d6b`, `#17140f`, 0.4), e4.add(this.hemi), this.moon = new Ns(`#8fa6c8`, 0.6), this.moon.castShadow = true;
    let t2 = this.moon.shadow;
    t2.mapSize.set(2048, 2048), t2.camera.left = -24, t2.camera.right = 24, t2.camera.top = 24, t2.camera.bottom = -24, t2.camera.near = 1, t2.camera.far = 90, t2.bias = -6e-4, t2.normalBias = 0.03, t2.radius = 2.5, e4.add(this.moon), e4.add(this.moon.target), this.hero = new As(`#ffe0bf`, 24, 15, 1.6), this.hero.castShadow = false, e4.add(this.hero);
    for (let t3 = 0; t3 < 8; t3 += 1) {
      let t4 = new As(`#ff9a4a`, 0, 10, 2);
      t4.castShadow = false, this.pool.push(t4), e4.add(t4);
    }
  }
  applyPreset(e4) {
    this.base = e4, this.hemi.color.set(e4.hemiSky), this.hemi.groundColor.set(e4.hemiGround), this.hemi.intensity = e4.hemiIntensity, this.moon.color.set(e4.moonColor), this.moon.intensity = e4.moonIntensity, this.hero.color.set(e4.heroColor), this.hero.intensity = e4.heroIntensity, this.hero.distance = e4.heroDistance, this.scene.environmentIntensity = e4.envIntensity, this.scene.background = new P(e4.background);
  }
  get preset() {
    return this.base;
  }
  addEmitter(e4) {
    let t2 = { ...e4, active: e4.active ?? true, seed: this.seedCounter++ * 1.618 % 100 };
    return this.emitters.add(t2), t2;
  }
  removeEmitter(e4) {
    this.emitters.delete(e4);
  }
  clearEmitters() {
    this.emitters.clear();
  }
  ranked = [];
  update(e4, t2) {
    let n2 = 48 / 2048, r2 = Math.round(t2.x / n2) * n2, i2 = Math.round(t2.z / n2) * n2;
    this.moon.target.position.set(r2, 0, i2), this.moon.position.set(r2 + this.moonOffset.x, this.moonOffset.y, i2 + this.moonOffset.z), this.moon.target.updateMatrixWorld();
    let a2 = this.flash;
    this.moon.intensity = this.base.moonIntensity * (1 + a2 * 2.2), this.hemi.intensity = this.base.hemiIntensity * (1 + a2 * 1.2), this.hero.position.set(t2.x, t2.y + 3.2, t2.z), this.hero.intensity = this.base.heroIntensity * this.heroFactor, this.hero.distance = this.base.heroDistance * (1 + this.radiusBonus);
    let o2 = this.ranked;
    o2.length = 0;
    for (let e5 of this.emitters) {
      if (!e5.active || e5.intensity <= 0) continue;
      let n3 = e5.x - t2.x, r3 = e5.z - t2.z, i3 = n3 * n3 + r3 * r3;
      i3 > 1156 || (e5._score = e5.intensity * e5.priority / (1 + i3 / 60), o2.push(e5));
    }
    o2.sort((e5, t3) => t3._score - e5._score);
    for (let t3 = 0; t3 < 8; t3 += 1) {
      let n3 = this.pool[t3], r3 = o2[t3];
      if (!r3) {
        n3.intensity = 0;
        continue;
      }
      let i3 = 1;
      r3.flicker === 1 ? i3 = 1 + xh(e4, r3.seed) * 0.14 : r3.flicker === 2 ? i3 = 1 + xh(e4 * 1.3, r3.seed) * 0.22 : r3.flicker === 3 && (i3 = 1 + Math.sin(e4 * 2.2 + r3.seed) * 0.18), n3.color.copy(r3.color), n3.intensity = r3.intensity * i3, n3.distance = r3.distance;
      let a3 = r3.flicker === 2 ? 0.08 : r3.flicker === 1 ? 0.04 : 0;
      n3.position.set(r3.x + (a3 ? Math.sin(e4 * 9 + r3.seed) * a3 : 0), r3.y, r3.z + (a3 ? Math.cos(e4 * 11 + r3.seed) * a3 : 0));
    }
  }
};
function Ch(e4) {
  let t2 = new ai(), n2 = new Ho(10, 32, 16), r2 = new qo({ side: 1, depthWrite: false, vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`, fragmentShader: `varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 top = vec3(0.10, 0.13, 0.20);
        vec3 hor = vec3(0.16, 0.15, 0.16);
        vec3 bot = vec3(0.03, 0.025, 0.02);
        vec3 col = h > 0.0 ? mix(hor, top, pow(h, 0.7)) : mix(hor, bot, pow(-h, 0.5));
        // moon glow
        vec3 md = normalize(vec3(-0.4, 0.75, -0.55));
        float m = max(dot(vDir, md), 0.0);
        col += vec3(0.55, 0.65, 0.85) * (pow(m, 64.0) * 3.0 + pow(m, 6.0) * 0.25);
        // warm firelight bounce from the opposite side, low
        vec3 fd = normalize(vec3(0.6, 0.1, 0.7));
        float f = max(dot(vDir, fd), 0.0);
        col += vec3(0.9, 0.45, 0.15) * pow(f, 8.0) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }` });
  t2.add(new xa(n2, r2));
  let i2 = new Au(e4), a2 = i2.fromScene(t2, 0.02).texture;
  return i2.dispose(), n2.dispose(), r2.dispose(), a2;
}
var wh = { name: `CopyShader`, uniforms: { tDiffuse: { value: null }, opacity: { value: 1 } }, vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`, fragmentShader: `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}` };
Ed();
var Th = class {
  constructor() {
    this.isPass = true, this.enabled = true, this.needsSwap = true, this.clear = false, this.renderToScreen = false;
  }
  setSize() {
  }
  render() {
    console.error(`THREE.Pass: .render() must be implemented in derived pass.`);
  }
  dispose() {
  }
}, Eh = new js(-1, 1, 1, -1, 0, 1), Dh = new class extends Qi {
  constructor() {
    super(), this.setAttribute(`position`, new Bi([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)), this.setAttribute(`uv`, new Bi([0, 2, 0, 0, 2, 0], 2));
  }
}(), Oh = class {
  constructor(e4) {
    this._mesh = new xa(Dh, e4);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(e4) {
    e4.render(this._mesh, Eh);
  }
  get material() {
    return this._mesh.material;
  }
  set material(e4) {
    this._mesh.material = e4;
  }
};
Ed();
var kh = class extends Th {
  constructor(e4, t2 = `tDiffuse`) {
    super(), this.textureID = t2, this.uniforms = null, this.material = null, e4 instanceof qo ? (this.uniforms = e4.uniforms, this.material = e4) : e4 && (this.uniforms = Wo.clone(e4.uniforms), this.material = new qo({ name: e4.name === void 0 ? `unspecified` : e4.name, defines: Object.assign({}, e4.defines), uniforms: this.uniforms, vertexShader: e4.vertexShader, fragmentShader: e4.fragmentShader })), this._fsQuad = new Oh(this.material);
  }
  render(e4, t2, n2) {
    this.uniforms[this.textureID] && (this.uniforms[this.textureID].value = n2.texture), this._fsQuad.material = this.material, this.renderToScreen ? (e4.setRenderTarget(null), this._fsQuad.render(e4)) : (e4.setRenderTarget(t2), this.clear && e4.clear(e4.autoClearColor, e4.autoClearDepth, e4.autoClearStencil), this._fsQuad.render(e4));
  }
  dispose() {
    this.material.dispose(), this._fsQuad.dispose();
  }
}, Ah = class extends Th {
  constructor(e4, t2) {
    super(), this.scene = e4, this.camera = t2, this.clear = true, this.needsSwap = false, this.inverse = false;
  }
  render(e4, t2, n2) {
    let r2 = e4.getContext(), i2 = e4.state;
    i2.buffers.color.setMask(false), i2.buffers.depth.setMask(false), i2.buffers.color.setLocked(true), i2.buffers.depth.setLocked(true);
    let a2, o2;
    this.inverse ? (a2 = 0, o2 = 1) : (a2 = 1, o2 = 0), i2.buffers.stencil.setTest(true), i2.buffers.stencil.setOp(r2.REPLACE, r2.REPLACE, r2.REPLACE), i2.buffers.stencil.setFunc(r2.ALWAYS, a2, 4294967295), i2.buffers.stencil.setClear(o2), i2.buffers.stencil.setLocked(true), e4.setRenderTarget(n2), this.clear && e4.clear(), e4.render(this.scene, this.camera), e4.setRenderTarget(t2), this.clear && e4.clear(), e4.render(this.scene, this.camera), i2.buffers.color.setLocked(false), i2.buffers.depth.setLocked(false), i2.buffers.color.setMask(true), i2.buffers.depth.setMask(true), i2.buffers.stencil.setLocked(false), i2.buffers.stencil.setFunc(r2.EQUAL, 1, 4294967295), i2.buffers.stencil.setOp(r2.KEEP, r2.KEEP, r2.KEEP), i2.buffers.stencil.setLocked(true);
  }
}, jh = class extends Th {
  constructor() {
    super(), this.needsSwap = false;
  }
  render(e4) {
    e4.state.buffers.stencil.setLocked(false), e4.state.buffers.stencil.setTest(false);
  }
};
Ed();
var Mh = class {
  constructor(e4, t2) {
    if (this.renderer = e4, this._pixelRatio = e4.getPixelRatio(), t2 === void 0) {
      let n2 = e4.getSize(new M());
      this._width = n2.width, this._height = n2.height, t2 = new xr(this._width * this._pixelRatio, this._height * this._pixelRatio, { type: Nt }), t2.texture.name = `EffectComposer.rt1`;
    } else this._width = t2.width, this._height = t2.height;
    this.renderTarget1 = t2, this.renderTarget2 = t2.clone(), this.renderTarget2.texture.name = `EffectComposer.rt2`, this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2, this.renderToScreen = true, this.passes = [], this.copyPass = new kh(wh), this.copyPass.material.blending = 0, this.timer = new zs();
  }
  swapBuffers() {
    let e4 = this.readBuffer;
    this.readBuffer = this.writeBuffer, this.writeBuffer = e4;
  }
  addPass(e4) {
    this.passes.push(e4), e4.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  insertPass(e4, t2) {
    this.passes.splice(t2, 0, e4), e4.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  removePass(e4) {
    let t2 = this.passes.indexOf(e4);
    t2 !== -1 && this.passes.splice(t2, 1);
  }
  isLastEnabledPass(e4) {
    for (let t2 = e4 + 1; t2 < this.passes.length; t2++) if (this.passes[t2].enabled) return false;
    return true;
  }
  render(e4) {
    this.timer.update(), e4 === void 0 && (e4 = this.timer.getDelta());
    let t2 = this.renderer.getRenderTarget(), n2 = false;
    for (let t3 = 0, r2 = this.passes.length; t3 < r2; t3++) {
      let r3 = this.passes[t3];
      if (r3.enabled !== false) {
        if (r3.renderToScreen = this.renderToScreen && this.isLastEnabledPass(t3), r3.render(this.renderer, this.writeBuffer, this.readBuffer, e4, n2), r3.needsSwap) {
          if (n2) {
            let t4 = this.renderer.getContext(), n3 = this.renderer.state.buffers.stencil;
            n3.setFunc(t4.NOTEQUAL, 1, 4294967295), this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, e4), n3.setFunc(t4.EQUAL, 1, 4294967295);
          }
          this.swapBuffers();
        }
        Ah !== void 0 && (r3 instanceof Ah ? n2 = true : r3 instanceof jh && (n2 = false));
      }
    }
    this.renderer.setRenderTarget(t2);
  }
  reset(e4) {
    if (e4 === void 0) {
      let t2 = this.renderer.getSize(new M());
      this._pixelRatio = this.renderer.getPixelRatio(), this._width = t2.width, this._height = t2.height, e4 = this.renderTarget1.clone(), e4.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }
    this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.renderTarget1 = e4, this.renderTarget2 = e4.clone(), this.writeBuffer = this.renderTarget1, this.readBuffer = this.renderTarget2;
  }
  setSize(e4, t2) {
    this._width = e4, this._height = t2;
    let n2 = this._width * this._pixelRatio, r2 = this._height * this._pixelRatio;
    this.renderTarget1.setSize(n2, r2), this.renderTarget2.setSize(n2, r2);
    for (let e5 = 0; e5 < this.passes.length; e5++) this.passes[e5].setSize(n2, r2);
  }
  setPixelRatio(e4) {
    this._pixelRatio = e4, this.setSize(this._width, this._height);
  }
  dispose() {
    this.renderTarget1.dispose(), this.renderTarget2.dispose(), this.copyPass.dispose();
  }
};
Ed();
var Nh = class extends Th {
  constructor(e4, t2, n2 = null, r2 = null, i2 = null) {
    super(), this.scene = e4, this.camera = t2, this.overrideMaterial = n2, this.clearColor = r2, this.clearAlpha = i2, this.clear = true, this.clearDepth = false, this.needsSwap = false, this.isRenderPass = true, this._oldClearColor = new P();
  }
  render(e4, t2, n2) {
    let r2 = e4.autoClear;
    e4.autoClear = false;
    let i2, a2;
    this.overrideMaterial !== null && (a2 = this.scene.overrideMaterial, this.scene.overrideMaterial = this.overrideMaterial), this.clearColor !== null && (e4.getClearColor(this._oldClearColor), e4.setClearColor(this.clearColor, e4.getClearAlpha())), this.clearAlpha !== null && (i2 = e4.getClearAlpha(), e4.setClearAlpha(this.clearAlpha)), this.clearDepth == 1 && e4.clearDepth(), e4.setRenderTarget(this.renderToScreen ? null : n2), this.clear === true && e4.clear(e4.autoClearColor, e4.autoClearDepth, e4.autoClearStencil), e4.render(this.scene, this.camera), this.clearColor !== null && e4.setClearColor(this._oldClearColor), this.clearAlpha !== null && e4.setClearAlpha(i2), this.overrideMaterial !== null && (this.scene.overrideMaterial = a2), e4.autoClear = r2;
  }
};
Ed();
var Ph = { name: `LuminosityHighPassShader`, uniforms: { tDiffuse: { value: null }, luminosityThreshold: { value: 1 }, smoothWidth: { value: 1 }, defaultColor: { value: new P(0) }, defaultOpacity: { value: 0 } }, vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`, fragmentShader: `

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}` };
Ed();
var Fh = class e3 extends Th {
  constructor(e4, t2 = 1, n2, r2) {
    super(), this.strength = t2, this.radius = n2, this.threshold = r2, this.resolution = e4 === void 0 ? new M(256, 256) : new M(e4.x, e4.y), this.clearColor = new P(0, 0, 0), this.needsSwap = false, this.renderTargetsHorizontal = [], this.renderTargetsVertical = [], this.nMips = 5;
    let i2 = Math.round(this.resolution.x / 2), a2 = Math.round(this.resolution.y / 2);
    this.renderTargetBright = new xr(i2, a2, { type: Nt }), this.renderTargetBright.texture.name = `UnrealBloomPass.bright`, this.renderTargetBright.texture.generateMipmaps = false;
    for (let e5 = 0; e5 < this.nMips; e5++) {
      let t3 = new xr(i2, a2, { type: Nt });
      t3.texture.name = `UnrealBloomPass.h` + e5, t3.texture.generateMipmaps = false, this.renderTargetsHorizontal.push(t3);
      let n3 = new xr(i2, a2, { type: Nt });
      n3.texture.name = `UnrealBloomPass.v` + e5, n3.texture.generateMipmaps = false, this.renderTargetsVertical.push(n3), i2 = Math.round(i2 / 2), a2 = Math.round(a2 / 2);
    }
    let o2 = Ph;
    this.highPassUniforms = Wo.clone(o2.uniforms), this.highPassUniforms.luminosityThreshold.value = r2, this.highPassUniforms.smoothWidth.value = 0.01, this.materialHighPassFilter = new qo({ uniforms: this.highPassUniforms, vertexShader: o2.vertexShader, fragmentShader: o2.fragmentShader }), this.separableBlurMaterials = [];
    let s2 = [6, 10, 14, 18, 22];
    i2 = Math.round(this.resolution.x / 2), a2 = Math.round(this.resolution.y / 2);
    for (let e5 = 0; e5 < this.nMips; e5++) this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s2[e5])), this.separableBlurMaterials[e5].uniforms.invSize.value = new M(1 / i2, 1 / a2), i2 = Math.round(i2 / 2), a2 = Math.round(a2 / 2);
    this.compositeMaterial = this._getCompositeMaterial(this.nMips), this.compositeMaterial.uniforms.blurTexture1.value = this.renderTargetsVertical[0].texture, this.compositeMaterial.uniforms.blurTexture2.value = this.renderTargetsVertical[1].texture, this.compositeMaterial.uniforms.blurTexture3.value = this.renderTargetsVertical[2].texture, this.compositeMaterial.uniforms.blurTexture4.value = this.renderTargetsVertical[3].texture, this.compositeMaterial.uniforms.blurTexture5.value = this.renderTargetsVertical[4].texture, this.compositeMaterial.uniforms.bloomStrength.value = t2, this.compositeMaterial.uniforms.bloomRadius.value = 0.1;
    let c2 = [1, 0.8, 0.6, 0.4, 0.2];
    this.compositeMaterial.uniforms.bloomFactors.value = c2, this.bloomTintColors = [new N(1, 1, 1), new N(1, 1, 1), new N(1, 1, 1), new N(1, 1, 1), new N(1, 1, 1)], this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors, this.copyUniforms = Wo.clone(wh.uniforms), this.blendMaterial = new qo({ uniforms: this.copyUniforms, vertexShader: wh.vertexShader, fragmentShader: wh.fragmentShader, premultipliedAlpha: true, blending: 2, depthTest: false, depthWrite: false, transparent: true }), this._oldClearColor = new P(), this._oldClearAlpha = 1, this._basic = new la(), this._fsQuad = new Oh(null);
  }
  dispose() {
    for (let e4 = 0; e4 < this.renderTargetsHorizontal.length; e4++) this.renderTargetsHorizontal[e4].dispose();
    for (let e4 = 0; e4 < this.renderTargetsVertical.length; e4++) this.renderTargetsVertical[e4].dispose();
    this.renderTargetBright.dispose();
    for (let e4 = 0; e4 < this.separableBlurMaterials.length; e4++) this.separableBlurMaterials[e4].dispose();
    this.compositeMaterial.dispose(), this.blendMaterial.dispose(), this._basic.dispose(), this._fsQuad.dispose();
  }
  setSize(e4, t2) {
    let n2 = Math.round(e4 / 2), r2 = Math.round(t2 / 2);
    this.renderTargetBright.setSize(n2, r2);
    for (let e5 = 0; e5 < this.nMips; e5++) this.renderTargetsHorizontal[e5].setSize(n2, r2), this.renderTargetsVertical[e5].setSize(n2, r2), this.separableBlurMaterials[e5].uniforms.invSize.value = new M(1 / n2, 1 / r2), n2 = Math.round(n2 / 2), r2 = Math.round(r2 / 2);
  }
  render(t2, n2, r2, i2, a2) {
    t2.getClearColor(this._oldClearColor), this._oldClearAlpha = t2.getClearAlpha();
    let o2 = t2.autoClear;
    t2.autoClear = false, t2.setClearColor(this.clearColor, 0), a2 && t2.state.buffers.stencil.setTest(false), this.renderToScreen && (this._fsQuad.material = this._basic, this._basic.map = r2.texture, t2.setRenderTarget(null), t2.clear(), this._fsQuad.render(t2)), this.highPassUniforms.tDiffuse.value = r2.texture, this.highPassUniforms.luminosityThreshold.value = this.threshold, this._fsQuad.material = this.materialHighPassFilter, t2.setRenderTarget(this.renderTargetBright), t2.clear(), this._fsQuad.render(t2);
    let s2 = this.renderTargetBright;
    for (let n3 = 0; n3 < this.nMips; n3++) this._fsQuad.material = this.separableBlurMaterials[n3], this.separableBlurMaterials[n3].uniforms.colorTexture.value = s2.texture, this.separableBlurMaterials[n3].uniforms.direction.value = e3.BlurDirectionX, t2.setRenderTarget(this.renderTargetsHorizontal[n3]), t2.clear(), this._fsQuad.render(t2), this.separableBlurMaterials[n3].uniforms.colorTexture.value = this.renderTargetsHorizontal[n3].texture, this.separableBlurMaterials[n3].uniforms.direction.value = e3.BlurDirectionY, t2.setRenderTarget(this.renderTargetsVertical[n3]), t2.clear(), this._fsQuad.render(t2), s2 = this.renderTargetsVertical[n3];
    this._fsQuad.material = this.compositeMaterial, this.compositeMaterial.uniforms.bloomStrength.value = this.strength, this.compositeMaterial.uniforms.bloomRadius.value = this.radius, this.compositeMaterial.uniforms.bloomTintColors.value = this.bloomTintColors, t2.setRenderTarget(this.renderTargetsHorizontal[0]), t2.clear(), this._fsQuad.render(t2), this._fsQuad.material = this.blendMaterial, this.copyUniforms.tDiffuse.value = this.renderTargetsHorizontal[0].texture, a2 && t2.state.buffers.stencil.setTest(true), this.renderToScreen ? (t2.setRenderTarget(null), this._fsQuad.render(t2)) : (t2.setRenderTarget(r2), this._fsQuad.render(t2)), t2.setClearColor(this._oldClearColor, this._oldClearAlpha), t2.autoClear = o2;
  }
  _getSeparableBlurMaterial(e4) {
    let t2 = [], n2 = e4 / 3;
    for (let r2 = 0; r2 < e4; r2++) t2.push(0.39894 * Math.exp(-0.5 * r2 * r2 / (n2 * n2)) / n2);
    return new qo({ defines: { KERNEL_RADIUS: e4 }, uniforms: { colorTexture: { value: null }, invSize: { value: new M(0.5, 0.5) }, direction: { value: new M(0.5, 0.5) }, gaussianCoefficients: { value: t2 } }, vertexShader: `

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`, fragmentShader: `

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}` });
  }
  _getCompositeMaterial(e4) {
    return new qo({ defines: { NUM_MIPS: e4 }, uniforms: { blurTexture1: { value: null }, blurTexture2: { value: null }, blurTexture3: { value: null }, blurTexture4: { value: null }, blurTexture5: { value: null }, bloomStrength: { value: 1 }, bloomFactors: { value: null }, bloomTintColors: { value: null }, bloomRadius: { value: 0 } }, vertexShader: `

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`, fragmentShader: `

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}` });
  }
};
Fh.BlurDirectionX = new M(1, 0), Fh.BlurDirectionY = new M(0, 1);
var Ih = { name: `OutputShader`, uniforms: { tDiffuse: { value: null }, toneMappingExposure: { value: 1 } }, vertexShader: `
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`, fragmentShader: `

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}` };
Ed();
var Lh = class extends Th {
  constructor() {
    super(), this.isOutputPass = true, this.uniforms = Wo.clone(Ih.uniforms), this.material = new Jo({ name: Ih.name, uniforms: this.uniforms, vertexShader: Ih.vertexShader, fragmentShader: Ih.fragmentShader }), this._fsQuad = new Oh(this.material), this._outputColorSpace = null, this._toneMapping = null;
  }
  render(e4, t2, n2) {
    this.uniforms.tDiffuse.value = n2.texture, this.uniforms.toneMappingExposure.value = e4.toneMappingExposure, (this._outputColorSpace !== e4.outputColorSpace || this._toneMapping !== e4.toneMapping) && (this._outputColorSpace = e4.outputColorSpace, this._toneMapping = e4.toneMapping, this.material.defines = {}, dr.getTransfer(this._outputColorSpace) === `srgb` && (this.material.defines.SRGB_TRANSFER = ``), this._toneMapping === 1 ? this.material.defines.LINEAR_TONE_MAPPING = `` : this._toneMapping === 2 ? this.material.defines.REINHARD_TONE_MAPPING = `` : this._toneMapping === 3 ? this.material.defines.CINEON_TONE_MAPPING = `` : this._toneMapping === 4 ? this.material.defines.ACES_FILMIC_TONE_MAPPING = `` : this._toneMapping === 6 ? this.material.defines.AGX_TONE_MAPPING = `` : this._toneMapping === 7 ? this.material.defines.NEUTRAL_TONE_MAPPING = `` : this._toneMapping === 5 && (this.material.defines.CUSTOM_TONE_MAPPING = ``), this.material.needsUpdate = true), this.renderToScreen === true ? (e4.setRenderTarget(null), this._fsQuad.render(e4)) : (e4.setRenderTarget(t2), this.clear && e4.clear(e4.autoClearColor, e4.autoClearDepth, e4.autoClearStencil), this._fsQuad.render(e4));
  }
  dispose() {
    this.material.dispose(), this._fsQuad.dispose();
  }
};
Ed();
var Rh = { uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new M(1, 1) }, uVignette: { value: 0.55 }, uGrain: { value: 0.045 }, uSaturation: { value: 0.92 }, uContrast: { value: 1.06 }, uShadowTint: { value: new N(0.94, 0.98, 1.07) }, uHighTint: { value: new N(1.05, 1, 0.93) }, uHurt: { value: 0 }, uFade: { value: 0 }, uTint: { value: new N(1, 1, 1) }, uTintAmt: { value: 0 }, uDesat: { value: 0 }, uAberration: { value: 25e-5 }, uFlash: { value: 0 } }, vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `, fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uGrain, uSaturation, uContrast, uHurt, uFade, uTintAmt, uDesat, uAberration, uFlash;
    uniform vec2 uRes;
    uniform vec3 uShadowTint, uHighTint, uTint;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      // subtle chromatic aberration toward the edges
      vec2 off = c * r2 * uAberration * 40.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      // split-tone grade (display space): cool shadows, warm highlights
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col *= mix(uShadowTint, uHighTint, smoothstep(0.08, 0.75, l));
      // contrast around mid grey + saturation
      col = (col - 0.5) * uContrast + 0.5;
      float l2 = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l2), col, uSaturation * (1.0 - uDesat));
      col = mix(col, col * uTint, uTintAmt);
      // vignette (elliptical, aspect aware)
      vec2 cv = c * vec2(uRes.x / uRes.y, 1.0) * 0.82;
      float vig = smoothstep(0.95, 0.25, length(cv));
      col *= mix(1.0, vig, uVignette);
      // hurt pulse: blood-red edges
      float edge = smoothstep(0.25, 0.85, length(cv));
      col = mix(col, vec3(0.45, 0.02, 0.02), uHurt * edge * 0.75);
      col += vec3(1.0, 0.95, 0.85) * uFlash;
      // film grain
      float g = hash(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5;
      col += g * uGrain * (1.0 - l * 0.6);
      col = mix(col, vec3(0.0), uFade);
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  ` }, zh = class {
  canvas;
  renderer;
  composer;
  renderPass;
  bloom;
  grade;
  output;
  width = 1;
  height = 1;
  dpr = 1;
  quality = `high`;
  maxDpr = 2;
  constructor(e4, t2, n2) {
    this.canvas = e4, this.renderer = new Td({ canvas: e4, antialias: false, alpha: false, stencil: false, powerPreference: `high-performance`, preserveDrawingBuffer: false });
    let r2 = this.renderer;
    r2.outputColorSpace = Vn, r2.toneMapping = 4, r2.toneMappingExposure = ashlarLook?.exposure ?? 1 /* [ASHLAR] global exposure lift, config.json "look" */, r2.shadowMap.enabled = true, r2.shadowMap.type = 1, r2.setClearColor(329482, 1), r2.info.autoReset = false;
    let i2 = new xr(1, 1, { type: Nt, samples: 4 });
    this.composer = new Mh(r2, i2), this.renderPass = new Nh(t2, n2), this.composer.addPass(this.renderPass), this.bloom = new Fh(new M(256, 256), 0.5, 0.42, 1);
    let a2 = this.bloom.materialHighPassFilter;
    a2.fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float luminosityThreshold;
      uniform float smoothWidth;
      varying vec2 vUv;
      void main() {
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        if (any(isnan(c))) c = vec3(0.0);
        c = clamp(c, 0.0, 5.0);
        float v = dot(c, vec3(0.2126, 0.7152, 0.0722));
        float knee = max(smoothWidth, 0.5);
        float soft = clamp(v - luminosityThreshold + knee, 0.0, 2.0 * knee);
        soft = soft * soft / (4.0 * knee + 1e-4);
        float contrib = max(soft, v - luminosityThreshold) / max(v, 1e-4);
        gl_FragColor = vec4(c * contrib, 1.0);
      }`, a2.needsUpdate = true, this.composer.addPass(this.bloom), this.output = new Lh(), this.composer.addPass(this.output), this.grade = new kh(Rh), this.composer.addPass(this.grade), this.resize(true);
  }
  get gradeUniforms() {
    return this.grade.uniforms;
  }
  setQuality(e4) {
    this.quality = e4, this.maxDpr = e4 === `high` ? 2 : e4 === `medium` ? 1.5 : 1, this.bloom.enabled = e4 !== `low`;
    let t2 = e4 === `high` ? 4 : e4 === `medium` ? 2 : 0;
    this.composer.renderTarget1.samples = t2, this.composer.renderTarget2.samples = t2, this.renderer.shadowMap.enabled = e4 !== `low`, this.resize(true);
  }
  resize(e4 = false) {
    let t2 = Math.max(1, Math.floor(this.canvas.clientWidth || window.innerWidth)), n2 = Math.max(1, Math.floor(this.canvas.clientHeight || window.innerHeight)), r2 = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    return !e4 && t2 === this.width && n2 === this.height && r2 === this.dpr ? false : (this.width = t2, this.height = n2, this.dpr = r2, this.renderer.setPixelRatio(r2), this.renderer.setSize(t2, n2, false), this.composer.setPixelRatio(r2), this.composer.setSize(t2, n2), this.bloom.setSize(Math.max(1, Math.floor(t2 * r2 / 2)), Math.max(1, Math.floor(n2 * r2 / 2))), this.gradeUniforms.uRes.value.set(t2 * r2, n2 * r2), true);
  }
  get size() {
    return { width: this.width, height: this.height, dpr: this.dpr };
  }
  skipDraw = false;
  render(e4, t2, n2) {
    this.skipDraw || (this.renderPass.scene = e4, this.renderPass.camera = t2, this.gradeUniforms.uTime.value = n2, this.renderer.info.reset(), this.composer.render());
  }
  dispose() {
    this.composer.dispose(), this.renderer.dispose();
  }
};
