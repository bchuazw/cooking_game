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

/** Single AABB water volume; `scene.w` = top Y; bottom is fixed in world space. */
export const waterVertexShader = /* wgsl */ `
${uniformsStruct}

struct WaterOut {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) @interpolate(flat) faceNx: f32,
  @location(2) @interpolate(flat) faceNy: f32,
  @location(3) @interpolate(flat) faceNz: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> WaterOut {
  var o: WaterOut;
  let localVertIdx = vertexIndex % 36u;
  let faceIdx = localVertIdx / 6u;
  let vertIdx = localVertIdx % 6u;

  let gridSize = uniforms.scene.x;
  let blockSize = ${BLOCK_SIZE};
  let halfGrid = gridSize * blockSize * 0.5;
  let bottomY = ${WATER_BOX_BOTTOM_Y};
  let topYBase = uniforms.scene.w;
  let time = uniforms.params.y;
  let progress = uniforms.params.w;

  let quadVerts = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  );
  let qv = quadVerts[vertIdx];
  let hw = halfGrid;
  let hd = halfGrid;

  var localPos = vec3f(0.0);
  var normal = vec3f(0.0);

  if (faceIdx == 0u) {
    let wx = (qv.x - 0.5) * 2.0 * hw;
    let wz = (qv.y - 0.5) * 2.0 * hd;
    let eco = uniforms.eco;
    let flatBlend = smoothstep(0.78, 1.0, progress);
    let ecoMag = eco.z * (1.0 - flatBlend);
    let ptrX = (eco.x - 0.5) * 2.0 * hw;
    let ptrZ = (0.5 - eco.y) * 2.0 * hd;
    let dPtr = length(vec2f(wx - ptrX, wz - ptrZ));
    let rip =
      sin(dPtr * 18.0 - time * 4.2) * 0.012 * ecoMag * exp(-dPtr * 0.48 / max(hw, 0.01)) +
      eco.w * sin(dPtr * 24.0 - time * 8.0) * 0.015 * exp(-dPtr * 0.38 / max(hw, 0.01));
    let wave =
      sin(time * 1.15 + wx * 7.5 + wz * 5.5) * 0.015 +
      sin(time * 1.85 - wx * 10.0 + wz * 4.0) * 0.009 +
      sin(time * 0.75 + (wx + wz) * 9.0) * 0.006 +
      rip;
    let topY = topYBase + wave;
    localPos = vec3f(wx, topY, wz);
    let nx = -cos(time * 1.15 + wx * 7.5 + wz * 5.5) * 7.5 * 0.015;
    let nz = -cos(time * 1.85 - wx * 10.0 + wz * 4.0) * (-10.0) * 0.009;
    normal = normalize(vec3f(nx * 0.32, 1.0, nz * 0.32));
  } else if (faceIdx == 1u) {
    localPos = vec3f((qv.x - 0.5) * 2.0 * hw, bottomY, (0.5 - qv.y) * 2.0 * hd);
    normal = vec3f(0.0, -1.0, 0.0);
  } else if (faceIdx == 2u) {
    let wy = mix(bottomY, topYBase, qv.y);
    let wobble = sin(time * 0.9 + wy * 14.0 + qv.x * 6.0) * 0.0035;
    localPos = vec3f((qv.x - 0.5) * 2.0 * hw + wobble, wy, hd);
    normal = vec3f(0.0, 0.0, 1.0);
  } else if (faceIdx == 3u) {
    let wy = mix(bottomY, topYBase, qv.y);
    let wobble = sin(time * 0.85 + wy * 13.0 + qv.x * 5.5) * 0.0035;
    localPos = vec3f((0.5 - qv.x) * 2.0 * hw - wobble, wy, -hd);
    normal = vec3f(0.0, 0.0, -1.0);
  } else if (faceIdx == 4u) {
    let wy = mix(bottomY, topYBase, qv.y);
    let wobble = sin(time * 0.95 + wy * 14.0 + qv.y * 5.0) * 0.0035;
    localPos = vec3f(hw, wy, (qv.x - 0.5) * 2.0 * hd + wobble);
    normal = vec3f(1.0, 0.0, 0.0);
  } else {
    let wy = mix(bottomY, topYBase, qv.y);
    let wobble = sin(time * 0.88 + wy * 13.5 + qv.y * 5.0) * 0.0035;
    localPos = vec3f(-hw, wy, (0.5 - qv.x) * 2.0 * hd - wobble);
    normal = vec3f(-1.0, 0.0, 0.0);
  }

  o.worldPos = localPos;
  o.faceNx = normal.x;
  o.faceNy = normal.y;
  o.faceNz = normal.z;

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

  o.position = vec4f(
    (ry_x + xOffsetScene) * scaleX,
    (rx_y + yOffsetScene) * scaleY,
    rx_z * 0.01 + 0.5,
    1.0
  );
  return o;
}
`;
