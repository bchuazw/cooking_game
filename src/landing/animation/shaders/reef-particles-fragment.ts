import { uniformsStruct } from './helpers';

export const reefParticlesFragmentShader = /* wgsl */ `
${uniformsStruct}

struct ReefParticleIn {
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) fade: f32,
  @location(2) @interpolate(flat) kind: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(input: ReefParticleIn) -> @location(0) vec4f {
  if (uniforms.theme.x < 0.5) {
    discard;
  }
  let d = length(input.uv - vec2f(0.5));
  if (d > 0.48) {
    discard;
  }
  let soft = 1.0 - smoothstep(0.12, 0.45, d);
  let bubble = input.kind > 0.5;
  var col = vec3f(0.75, 0.92, 1.0);
  if (bubble) {
    col = vec3f(0.82, 0.95, 1.0);
  } else {
    col = vec3f(0.55, 0.78, 0.62);
  }
  let a = soft * soft * input.fade * select(0.38, 0.52, bubble);
  return vec4f(col * a, a);
}
`;
