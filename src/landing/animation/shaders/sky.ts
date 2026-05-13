import { uniformsStruct } from './helpers';

export const skyVertexShader = /* wgsl */ `
${uniformsStruct}

struct SkyOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vi: u32) -> SkyOut {
  var tri = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0)
  );
  let p = tri[vi];
  var o: SkyOut;
  o.position = vec4f(p, 1.0, 1.0);
  o.uv = vec2f(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  return o;
}
`;

// Soft ocean sky gradient
export const skyFragmentShader = /* wgsl */ `
${uniformsStruct}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let reef = uniforms.theme.x > 0.5;
  let time = uniforms.params.y;
  let zenithR = vec3f(0.42, 0.68, 0.92);
  let horizonR = vec3f(0.82, 0.90, 0.98);
  let zenithT = vec3f(0.78, 0.88, 0.96);
  let horizonT = vec3f(0.94, 0.93, 0.91);
  var zenith = select(zenithT, zenithR, reef);
  var horizon = select(horizonT, horizonR, reef);
  if (reef) {
    let w1 = sin(uv.x * 6.28 + time * 0.11) * sin(uv.y * 9.0 - time * 0.08) * 0.025;
    let w2 = cos(uv.x * 14.0 - time * 0.07) * 0.012;
    zenith = zenith + vec3f(0.04, 0.06, 0.08) * w1 + vec3f(0.06, 0.08, 0.1) * w2;
    horizon = horizon + vec3f(0.05, 0.06, 0.07) * w2;
  }
  let t = pow(uv.y, 0.85);
  return vec4f(mix(horizon, zenith, t), 1.0);
}
`;
