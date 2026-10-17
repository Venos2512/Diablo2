// Importing a chunk registers it as THREE.ShaderChunk.lab_<name> (see core/shaderRegistry.js).
import common from './common.glsl';
import noise from './noise.glsl';
import pbrValidate from './pbr_validate.glsl';
import surface from './surface.glsl';
import time from './time.glsl';
import vfx from './vfx.glsl';

export const GLSL_CHUNKS = { common, noise, pbrValidate, surface, time, vfx };
