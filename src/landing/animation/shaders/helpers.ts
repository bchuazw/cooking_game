import { RGB } from '../types';

/**
 * Converts an RGB color object to a WGSL vec3f string.
 */
export function wgslVec3(c: RGB): string {
  return `vec3f(${c.r.toFixed(6)}, ${c.g.toFixed(6)}, ${c.b.toFixed(6)})`;
}

/**
 * Common uniform struct used by all shaders.
 */
/**
 * params, scene, theme, eco — 64 bytes.
 * eco: pointer x,y (0–1), influence (0–1), ripple pulse (0–1 decay).
 */
export const uniformsStruct = /* wgsl */ `
struct Uniforms {
  params: vec4f,
  scene: vec4f,
  theme: vec4f,
  eco: vec4f,
}
`;
