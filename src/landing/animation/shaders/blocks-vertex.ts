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

export const blocksVertexShader = /* wgsl */ `
${uniformsStruct}

struct BlockOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) faceNx: f32,
  @location(2) @interpolate(flat) faceNy: f32,
  @location(3) @interpolate(flat) faceNz: f32,
  @location(4) @interpolate(flat) blockType: f32,
  @location(5) @interpolate(flat) blockH: f32,
  @location(6) @interpolate(flat) col: f32,
  @location(7) @interpolate(flat) row: f32,
  @location(8) @interpolate(flat) layer: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> blockTypes: array<u32>;
@group(0) @binding(2) var<storage, read> blockPositions: array<vec4f>;
@group(0) @binding(3) var<storage, read> blockHeights: array<f32>;
@group(0) @binding(4) var<storage, read> blockBaseY: array<f32>;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> BlockOutput {
  var output: BlockOutput;
  let blockIdx = vertexIndex / 36u;
  let localVertIdx = vertexIndex % 36u;
  let faceIdx = localVertIdx / 6u;
  let vertIdx = localVertIdx % 6u;

  let blockCount = u32(uniforms.params.z);
  if (blockIdx >= blockCount) {
    output.position = vec4f(0.0, 0.0, 2.0, 1.0);
    output.uv = vec2f(0.0);
    output.faceNx = 0.0;
    output.faceNy = 1.0;
    output.faceNz = 0.0;
    output.blockType = -1.0;
    output.blockH = 0.0;
    output.col = 0.0;
    output.row = 0.0;
    output.layer = 0.0;
    return output;
  }

  let posData = blockPositions[blockIdx];
  let col = posData.x;
  let row = posData.y;
  output.col = col;
  output.row = row;

  let gridSize = uniforms.scene.x;
  let styleTree = uniforms.theme.x < 0.5;
  let motionOk = 1.0 - uniforms.scene.z;
  let time = uniforms.params.y;

  let blockSize = ${BLOCK_SIZE};
  let halfGrid = gridSize * blockSize * 0.5;
  let cubeSize = blockSize;

  let baseX = col * blockSize - halfGrid;
  let rawBaseY = blockBaseY[blockIdx];
  let baseY = rawBaseY;
  output.layer = rawBaseY / ${BLOCK_SIZE};
  let baseZ = row * blockSize - halfGrid;

  // Stored height supports 0→1 morph (grow/shrink) during QR transitions
  let storedH = blockHeights[blockIdx];
  let h = max(storedH, 1e-7);
  output.blockH = h;

  let typePacked = blockTypes[blockIdx];
  output.blockType = f32(typePacked);

  let quadVerts = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0)
  );
  let qv = quadVerts[vertIdx];
  let hw = cubeSize * 0.5;
  let hd = cubeSize * 0.5;

  var swayX = 0.0;
  var swayZ = 0.0;
  if (styleTree && typePacked == 1u && rawBaseY > 0.01) {
    let swayAmount = rawBaseY;
    swayX = sin(time * 0.8 + col * 0.3 + row * 0.2) * 0.008 * swayAmount * motionOk;
    swayZ = sin(time * 0.6 + col * 0.2 + row * 0.4) * 0.005 * swayAmount * motionOk;
  } else if (!styleTree && typePacked != 0u && rawBaseY > 1e-5) {
    let reefSway =
      motionOk *
      (1.0 - smoothstep(0.72, 1.0, uniforms.params.w)) *
      smoothstep(0.0, 4.5, rawBaseY / ${BLOCK_SIZE});
    var amp = 1.0;
    if (typePacked == 3u) {
      amp = 0.4;
    }
    let ph = time * 1.08 + col * 0.36 + row * 0.31 + rawBaseY * 3.2;
    swayX += sin(ph) * 0.0058 * reefSway * amp;
    swayZ += cos(ph * 0.89) * 0.005 * reefSway * amp;
  }

  var localPos = vec3f(0.0);
  var normal = vec3f(0.0);

  // Build cube faces
  if (faceIdx == 0u) {
    // Top face
    localPos = vec3f(baseX + (qv.x - 0.5) * cubeSize + swayX, baseY + h, baseZ + (qv.y - 0.5) * cubeSize + swayZ);
    normal = vec3f(0.0, 1.0, 0.0);
  } else if (faceIdx == 1u) {
    // Bottom face
    localPos = vec3f(baseX + (qv.x - 0.5) * cubeSize, baseY, baseZ + (0.5 - qv.y) * cubeSize);
    normal = vec3f(0.0, -1.0, 0.0);
  } else if (faceIdx == 2u) {
    // Front face
    localPos = vec3f(baseX + (qv.x - 0.5) * cubeSize + swayX * qv.y, baseY + qv.y * h, baseZ + hd + swayZ * qv.y);
    normal = vec3f(0.0, 0.0, 1.0);
  } else if (faceIdx == 3u) {
    // Back face
    localPos = vec3f(baseX + (0.5 - qv.x) * cubeSize + swayX * qv.y, baseY + qv.y * h, baseZ - hd + swayZ * qv.y);
    normal = vec3f(0.0, 0.0, -1.0);
  } else if (faceIdx == 4u) {
    // Right face
    localPos = vec3f(baseX + hw + swayX * qv.y, baseY + qv.y * h, baseZ + (qv.x - 0.5) * cubeSize + swayZ * qv.y);
    normal = vec3f(1.0, 0.0, 0.0);
  } else {
    // Left face
    localPos = vec3f(baseX - hw + swayX * qv.y, baseY + qv.y * h, baseZ + (0.5 - qv.x) * cubeSize + swayZ * qv.y);
    normal = vec3f(-1.0, 0.0, 0.0);
  }

  output.uv = qv;
  output.faceNx = normal.x;
  output.faceNy = normal.y;
  output.faceNz = normal.z;

  // Interpolate between 3D isometric and 2D flat view
  let progress = uniforms.params.w;
  let isoAngleY = mix(${ISO_ANGLE_Y}, ${FLAT_ANGLE_Y}, progress);
  let isoAngleX = mix(${ISO_ANGLE_X}, ${FLAT_ANGLE_X}, progress);

  let cy = cos(isoAngleY); let sy = sin(isoAngleY);
  let cx = cos(isoAngleX); let sx = sin(isoAngleX);

  // Apply rotation
  let ry_x = localPos.x * cy - localPos.z * sy;
  let ry_z = localPos.x * sy + localPos.z * cy;
  let rx_y = localPos.y * cx - ry_z * sx;
  let rx_z = localPos.y * sx + ry_z * cx;

  // View scaling
  let viewScale = mix(${VIEW_SCALE_3D}, ${VIEW_SCALE_2D}, progress);
  let ar = uniforms.params.x;
  let scaleX = viewScale / max(ar, 1.0);
  let scaleY = viewScale / max(1.0 / ar, 1.0);

  // Centering offsets for 2D view
  let yOffsetScene = mix(0.0, ${Y_OFFSET_2D}, progress);
  let xOffsetScene = mix(0.0, ${X_OFFSET_2D}, progress);

  output.position = vec4f(
    (ry_x + xOffsetScene) * scaleX,
    (rx_y + yOffsetScene) * scaleY,
    rx_z * 0.01 + 0.5,
    1.0
  );
  return output;
}
`;
