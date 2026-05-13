import { uniformsStruct } from './helpers';

export const waterFragmentShader = /* wgsl */ `
${uniformsStruct}

struct WaterIn {
  @location(0) worldPos: vec3f,
  @location(1) @interpolate(flat) faceNx: f32,
  @location(2) @interpolate(flat) faceNy: f32,
  @location(3) @interpolate(flat) faceNz: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(input: WaterIn) -> @location(0) vec4f {
  let progress = uniforms.params.w;
  let waterHide = smoothstep(0.9, 1.0, progress);
  if (waterHide > 0.98) {
    discard;
  }

  let time = uniforms.params.y;
  let eco = uniforms.eco;
  let flatBlend = smoothstep(0.78, 1.0, progress);
  let ecoMag = eco.z * (1.0 - flatBlend);
  let N = normalize(vec3f(input.faceNx, input.faceNy, input.faceNz));
  let up = vec3f(0.0, 1.0, 0.0);
  let viewish = normalize(vec3f(0.35, 0.5, 0.35));
  let fresnel = pow(1.0 - max(dot(N, viewish), 0.0), 2.0);
  let depthTint = smoothstep(uniforms.scene.w * 0.2, uniforms.scene.w, input.worldPos.y);

  let ripple =
    sin(input.worldPos.x * 11.0 + time * 1.5) *
    sin(input.worldPos.z * 10.0 - time * 1.25) * 0.055;
  let shimmer =
    sin(input.worldPos.x * 15.0 + input.worldPos.y * 9.0 + time * 2.1) * 0.035;
  let caust =
    sin(input.worldPos.x * 14.0 + time * 1.9) *
    cos(input.worldPos.z * 13.0 - time * 1.55) *
    0.045 *
    (0.4 + ecoMag * 0.6);

  let waterCol = mix(vec3f(0.1, 0.42, 0.58), vec3f(0.22, 0.68, 0.82), depthTint);
  let planktonHue = vec3f(0.08, 0.18, 0.12) * ecoMag * 0.35;
  let edgeBright = vec3f(0.52, 0.84, 0.96) * fresnel * (0.78 + ecoMag * 0.2);
  var a = mix(0.11, 0.28, fresnel) * (1.0 - waterHide);

  let vertical = abs(input.faceNy) < 0.12;
  let seabed = input.faceNy < -0.55;
  a = a * select(1.0, 0.16, vertical);
  a = a * select(1.0, 0.45, seabed);

  var rgb = waterCol * (0.42 + ripple + shimmer + caust) + edgeBright + planktonHue;
  rgb = mix(rgb, rgb * vec3f(1.05, 1.08, 1.1), max(dot(N, up), 0.0) * (0.12 + ecoMag * 0.07));
  rgb = rgb + vec3f(0.035, 0.1, 0.12) * eco.w * (1.0 - flatBlend) * fresnel;
  return vec4f(rgb * a, a);
}
`;
