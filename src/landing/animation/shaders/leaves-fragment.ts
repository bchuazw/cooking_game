import { uniformsStruct } from './helpers';

export const leavesFragmentShader = /* wgsl */ `
${uniformsStruct}

struct LeafInput {
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) fade: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(input: LeafInput) -> @location(0) vec4f {
  let uv = input.uv;
  let d = abs(uv.x - 0.5) + abs(uv.y - 0.5);
  if (d > 0.48) {
    discard;
  }
  let edge = 1.0 - smoothstep(0.28, 0.48, d);
  let pink = vec3f(0.92, 0.42, 0.62);
  let pale = vec3f(1.0, 0.78, 0.88);
  let t = uv.x * 0.6 + uv.y * 0.4;
  var col = mix(pink, pale, t);
  col *= 0.88 + 0.12 * sin(uv.x * 12.0 + uv.y * 9.0);
  let a = edge * 0.55 * input.fade;
  return vec4f(col * a, a);
}
`;
