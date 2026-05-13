import {
  BLOCK_SIZE,
  FLAT_ANGLE_X,
  FLAT_ANGLE_Y,
  ISO_ANGLE_X,
  ISO_ANGLE_Y,
  VIEW_SCALE_2D,
  VIEW_SCALE_3D,
  WATER_BOX_BOTTOM_Y,
  X_OFFSET_2D,
  Y_OFFSET_2D,
} from '../constants';
import { uniformsStruct } from './helpers';

/** Underwater specks: plankton drift + rising bubbles (3D reef only). */
export const reefParticlesVertexShader = /* wgsl */ `
${uniformsStruct}

struct ReefParticleOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) fade: f32,
  @location(2) @interpolate(flat) kind: f32,
}

fn hash11(n: f32) -> f32 {
  return fract(sin(n * 12.9898) * 43758.5453);
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> ReefParticleOut {
  var output: ReefParticleOut;
  let pid = vertexIndex / 6u;
  let vi = vertexIndex % 6u;
  let qv = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  )[vi];

  let time = uniforms.params.y;
  let progress = uniforms.params.w;
  let gridSize = uniforms.scene.x;
  let motionOff = uniforms.scene.z;

  let h1 = hash11(f32(pid) * 7.31);
  let h2 = hash11(f32(pid) * 13.17);
  let h3 = hash11(f32(pid) * 19.03);
  let h4 = hash11(f32(pid) * 29.41);

  let blockSize = ${BLOCK_SIZE};
  let halfGrid = gridSize * blockSize * 0.5;
  let margin = 0.11;
  let bottomY = ${WATER_BOX_BOTTOM_Y};
  let topY = uniforms.scene.w;

  let isBubble = h4 < 0.78;
  output.kind = select(0.0, 1.0, isBubble);

  var wx = mix(-halfGrid + margin, halfGrid - margin, h1);
  var wz = mix(-halfGrid + margin, halfGrid - margin, h2);

  let phase = h3 * 80.0;
  let swirl = sin(time * 0.55 + phase * 0.08) * 0.018;
  let swirl2 = cos(time * 0.42 + phase * 0.11) * 0.015;
  wx += swirl + sin(time * 1.1 + f32(pid) * 0.2) * 0.006;
  wz += swirl2 + cos(time * 0.95 + f32(pid) * 0.17) * 0.006;

  let eco = uniforms.eco;
  let ptrX = (eco.x - 0.5) * 2.0 * halfGrid;
  let ptrZ = (0.5 - eco.y) * 2.0 * halfGrid;
  let toP = vec2f(ptrX - wx, ptrZ - wz);
  let dP = length(toP);
  let ecoPull = eco.z * (1.0 - smoothstep(0.82, 1.0, progress)) * (1.0 - motionOff);
  wx += toP.x * ecoPull * 0.045 / max(dP, 0.08);
  wz += toP.y * ecoPull * 0.045 / max(dP, 0.08);

  var wy = bottomY + 0.02;
  if (isBubble) {
    let rise = fract(time * (0.11 + h1 * 0.07) + phase * 0.019 + h2 * 3.1);
    let ease = pow(rise, 0.82);
    wy = mix(bottomY + 0.006, topY - 0.05, ease);
    wy += sin(time * 3.1 + f32(pid)) * 0.004 * (1.0 - motionOff);
  } else {
    wy = mix(bottomY + 0.05, topY - 0.1, 0.38 + 0.32 * sin(time * 0.29 + phase * 0.12));
    wy += sin(time * 2.2 + phase) * 0.007 * (1.0 - motionOff);
  }

  let pSize = (0.0045 + h2 * 0.007) * select(1.0, 1.25, isBubble);
  let ang = time * 0.9 + phase;
  let sx = (qv.x - 0.5) * pSize;
  let sz = (qv.y - 0.5) * pSize;
  let lx = sx * cos(ang) - sz * sin(ang);
  let lz = sx * sin(ang) + sz * cos(ang);

  var localPos = vec3f(wx + lx, wy, wz + lz);

  let isoAngleY = mix(${ISO_ANGLE_Y}, ${FLAT_ANGLE_Y}, progress);
  let isoAngleX = mix(${ISO_ANGLE_X}, ${FLAT_ANGLE_X}, progress);
  let cy = cos(isoAngleY);
  let sy = sin(isoAngleY);
  let cx = cos(isoAngleX);
  let sx2 = sin(isoAngleX);
  let ry_x = localPos.x * cy - localPos.z * sy;
  let ry_z = localPos.x * sy + localPos.z * cy;
  let rx_y = localPos.y * cx - ry_z * sx2;
  let rx_z = localPos.y * sx2 + ry_z * cx;

  let viewScale = mix(${VIEW_SCALE_3D}, ${VIEW_SCALE_2D}, progress);
  let ar = uniforms.params.x;
  let scaleX = viewScale / max(ar, 1.0);
  let scaleY = viewScale / max(1.0 / ar, 1.0);
  let yOffsetScene = mix(0.0, ${Y_OFFSET_2D}, progress);
  let xOffsetScene = mix(0.0, ${X_OFFSET_2D}, progress);

  var fade = 0.55 * (1.0 - motionOff * 0.75);
  fade *= 1.0 - smoothstep(0.78, 1.0, progress);
  fade *= 0.88 + eco.w * 0.12;

  output.uv = qv;
  output.fade = fade;

  output.position = vec4f(
    (ry_x + xOffsetScene) * scaleX,
    (rx_y + yOffsetScene) * scaleY,
    rx_z * 0.01 + 0.5,
    1.0
  );
  return output;
}
`;
