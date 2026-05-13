import {
  BLOCK_SIZE,
  FLAT_ANGLE_X,
  FLAT_ANGLE_Y,
  ISO_ANGLE_X,
  ISO_ANGLE_Y,
  VIEW_SCALE_2D,
  VIEW_SCALE_3D,
  X_OFFSET_2D,
  Y_OFFSET_2D,
} from '../constants';
import { uniformsStruct } from './helpers';

export const leavesVertexShader = /* wgsl */ `
${uniformsStruct}

struct LeafOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) fade: f32,
}

fn hash11(n: f32) -> f32 {
  return fract(sin(n * 12.9898) * 43758.5453);
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> LeafOutput {
  var output: LeafOutput;
  let leafId = vertexIndex / 6u;
  let vi = vertexIndex % 6u;
  let qv = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  )[vi];

  let time = uniforms.params.y;
  let progress = uniforms.params.w;
  let gridSize = uniforms.scene.x;
  let motionOff = uniforms.scene.z;

  let h1 = hash11(f32(leafId) * 7.31);
  let h2 = hash11(f32(leafId) * 13.17);
  let h3 = hash11(f32(leafId) * 19.03);

  let blockSize = ${BLOCK_SIZE};
  let halfGrid = gridSize * blockSize * 0.5;
  let col = h1 * max(gridSize - 1.0, 1.0);
  let row = h2 * max(gridSize - 1.0, 1.0);
  let baseX = col * blockSize - halfGrid;
  let baseZ = row * blockSize - halfGrid;

  let phase = h3 * 48.0;
  let cycle = 7.0 + hash11(f32(leafId) * 5.55) * 9.0;
  let t = fract((time + phase * 0.12) / cycle);
  let yHigh = 0.42 + hash11(f32(leafId) * 23.1) * 0.38;
  let y = mix(yHigh, -0.03, t);

  let driftX = sin(time * 1.15 + phase * 0.08) * 0.032;
  let driftZ = cos(time * 0.88 + phase * 0.11) * 0.026;
  let flutter = sin(time * 2.4 + f32(leafId)) * 0.006 * (1.0 - motionOff);

  let leafSize = (0.011 + hash11(f32(leafId) * 41.0) * 0.012) * (0.85 + 0.15 * sin(time * 2.0 + phase));
  let ang = time * 0.65 + phase + hash11(f32(leafId) * 17.0) * 6.28318;
  let sx = (qv.x - 0.5) * leafSize;
  let sz = (qv.y - 0.5) * leafSize;
  let lx = sx * cos(ang) - sz * sin(ang);
  let lz = sx * sin(ang) + sz * cos(ang);

  var localPos = vec3f(
    baseX + lx + driftX,
    y + flutter,
    baseZ + lz + driftZ
  );

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

  var fade = 1.0;
  if (motionOff > 0.5) {
    fade = 0.12;
  }
  fade *= 1.0 - smoothstep(0.82, 1.0, progress);

  output.position = vec4f(
    (ry_x + xOffsetScene) * scaleX,
    (rx_y + yOffsetScene) * scaleY,
    rx_z * 0.01 + 0.5,
    1.0
  );
  output.uv = qv;
  output.fade = fade;
  return output;
}
`;
