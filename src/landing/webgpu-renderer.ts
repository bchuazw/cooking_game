import {
  LEAF_COUNT,
  LERP_SPEED,
  MAX_BLOCKS,
  REEF_PARTICLE_COUNT,
  STYLE_REEF,
  STYLE_TREE,
  URL_BLOCK_TRANSITION_SEC,
  WATER_BOX_TOP_Y,
} from './animation/constants';
import {
  blocksFragmentShader,
  blocksVertexShader,
  leavesFragmentShader,
  leavesVertexShader,
  reefParticlesFragmentShader,
  reefParticlesVertexShader,
  shadowFragmentShader,
  shadowVertexShader,
  skyFragmentShader,
  skyVertexShader,
  waterFragmentShader,
  waterVertexShader,
} from './animation/shaders';
import type { VisualStyleId } from './animation/visual-styles';
import type { BlockData } from './animation/types';
import {
  buildInterpolatedBlockData,
  cloneBlockData,
  tryBuildBlockData,
} from './animation/utils';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function errorText(err: unknown): string {
  if (err instanceof Error) {
    return `${err.message}${err.stack ? `\n\n${err.stack}` : ''}`;
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

function setGpuStatusLine(text: string) {
  const el = document.getElementById('gpu-status');
  if (el) el.textContent = text;
}

function setQrFeedback(text: string) {
  const el = document.getElementById('qr-feedback');
  if (el) el.textContent = text;
}

function showInitError(err: unknown) {
  const el = document.getElementById('wgpu-error');
  if (!el) return;
  const msg = errorText(err);
  el.hidden = false;
  el.style.removeProperty('display');
  el.innerHTML = `<strong>Could not start WebGPU</strong><span>Try Chrome or Edge (desktop). If you are already on Chrome, check <code style="display:inline;padding:0.1em 0.3em">chrome://gpu</code> and update GPU drivers.</span><code>${escapeHtml(msg)}</code>`;
  setGpuStatusLine('WebGPU failed — see message on canvas.');
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function configureWebGpuCanvas(
  context: GPUCanvasContext,
  device: GPUDevice,
  format: GPUTextureFormat,
) {
  context.configure({
    device,
    format,
    alphaMode: 'opaque',
    colorSpace: 'srgb',
  });
}

type BlockBuffers = {
  typeBuffer: GPUBuffer;
  posBuffer: GPUBuffer;
  heightBuffer: GPUBuffer;
  baseYBuffer: GPUBuffer;
};

function createBlockBuffers(device: GPUDevice): BlockBuffers {
  return {
    typeBuffer: device.createBuffer({
      size: MAX_BLOCKS * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    posBuffer: device.createBuffer({
      size: MAX_BLOCKS * 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    heightBuffer: device.createBuffer({
      size: MAX_BLOCKS * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    baseYBuffer: device.createBuffer({
      size: MAX_BLOCKS * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
  };
}

export interface CherryRendererOptions {
  canvas: HTMLCanvasElement;
  getQrContent: () => string;
  getIsFlat: () => boolean;
  getVisualStyle: () => VisualStyleId;
}

export function startCherryRenderer({
  canvas,
  getQrContent,
  getIsFlat,
  getVisualStyle,
}: CherryRendererOptions): { destroy: () => void; refreshQr: () => void } {
  let animationId: number | null = null;
  const startTime = Date.now();
  let progress = 0;
  let rawProgress = 0;
  let lastFrameTime = Date.now();
  let tabHidden = document.visibilityState === 'hidden';

  let aborted = false;
  let cleanup: (() => void) | undefined;
  let refreshQrImpl: (() => void) | null = null;

  document.addEventListener('visibilitychange', () => {
    tabHidden = document.visibilityState === 'hidden';
  });

  const init = async () => {
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    if (aborted) return;

    const context = canvas.getContext('webgpu');
    if (!context) {
      throw new Error('This browser did not return a WebGPU canvas context.');
    }

    const adapter = await navigator.gpu!.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (aborted) return;
    if (!adapter) {
      throw new Error(
        'No WebGPU adapter (GPU may be blocked, unavailable, or unsupported).',
      );
    }

    const device = await adapter.requestDevice();
    if (aborted) {
      device.destroy();
      return;
    }

    device.addEventListener('uncapturederror', e => {
      console.error(e.error);
      showInitError(
        e.error instanceof Error
          ? e.error
          : new Error(errorText(e.error)),
      );
    });
    void device.lost.then(info => {
      const el = document.getElementById('wgpu-error');
      if (!el) return;
      el.hidden = false;
      el.style.removeProperty('display');
      el.innerHTML = `<strong>GPU device lost</strong><code>${escapeHtml(info.message)}</code>`;
    });

    const format = navigator.gpu.getPreferredCanvasFormat();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    configureWebGpuCanvas(context, device, format);

    const initialBuild = tryBuildBlockData(
      getQrContent(),
      getVisualStyle(),
    );
    if (!initialBuild.ok) {
      throw new Error(initialBuild.error);
    }
    const initialData = initialBuild.data;
    let blockDataState = {
      numBlocks: initialData.numBlocks,
      gridSize: initialData.gridSize,
    };
    let contentShown = initialBuild.normalizedContent;
    let lastStyleShown: VisualStyleId = getVisualStyle();
    let lastBlockData: BlockData = cloneBlockData(initialData);

    const uniformBuffer = device.createBuffer({
      size: 256,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const blockBuffers = createBlockBuffers(device);
    updateBuffers(device, initialData, blockBuffers);

    let urlTransition: {
      from: BlockData;
      to: BlockData;
      /** Linear 0 → 1 over ~URL_BLOCK_TRANSITION_SEC */
      progress: number;
      targetContent: string;
    } | null = null;

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });

    const blocksBindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: { buffer: blockBuffers.typeBuffer } },
        { binding: 2, resource: { buffer: blockBuffers.posBuffer } },
        { binding: 3, resource: { buffer: blockBuffers.heightBuffer } },
        { binding: 4, resource: { buffer: blockBuffers.baseYBuffer } },
      ],
    });

    const skyBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const skyBindGroup = device.createBindGroup({
      layout: skyBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    const skyPipeline = await createPipelineAsync(device, format, skyBindGroupLayout, {
      vertex: skyVertexShader,
      fragment: skyFragmentShader,
      depthWrite: false,
      depthCompare: 'always',
    });
    if (aborted) return;

    const shadowPipeline = await createPipelineAsync(
      device,
      format,
      skyBindGroupLayout,
      {
        vertex: shadowVertexShader,
        fragment: shadowFragmentShader,
        depthWrite: false,
        depthCompare: 'always',
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      },
    );
    if (aborted) return;

    const blocksPipeline = await createPipelineAsync(device, format, bindGroupLayout, {
      vertex: blocksVertexShader,
      fragment: blocksFragmentShader,
      depthWrite: true,
      depthCompare: 'less',
    });
    if (aborted) return;

    const leavesPipeline = await createPipelineAsync(
      device,
      format,
      skyBindGroupLayout,
      {
        vertex: leavesVertexShader,
        fragment: leavesFragmentShader,
        depthWrite: false,
        depthCompare: 'less',
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      },
    );
    if (aborted) return;

    const waterPipeline = await createPipelineAsync(
      device,
      format,
      skyBindGroupLayout,
      {
        vertex: waterVertexShader,
        fragment: waterFragmentShader,
        depthWrite: false,
        depthCompare: 'less',
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      },
    );
    if (aborted) return;

    const reefParticlesPipeline = await createPipelineAsync(
      device,
      format,
      skyBindGroupLayout,
      {
        vertex: reefParticlesVertexShader,
        fragment: reefParticlesFragmentShader,
        depthWrite: false,
        depthCompare: 'less',
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      },
    );
    if (aborted) return;

    let depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const refreshQr = () => {
      if (aborted || !device) return;
      const style = getVisualStyle();
      const built = tryBuildBlockData(getQrContent(), style);
      if (!built.ok) {
        setQrFeedback(`Cannot build QR: ${built.error}`);
        return;
      }
      setQrFeedback('');

      if (
        built.normalizedContent === contentShown &&
        !urlTransition &&
        style === lastStyleShown
      ) {
        return;
      }

      if (style !== lastStyleShown) {
        updateBuffers(device, built.data, blockBuffers);
        lastBlockData = cloneBlockData(built.data);
        blockDataState = {
          numBlocks: built.data.numBlocks,
          gridSize: built.data.gridSize,
        };
        contentShown = built.normalizedContent;
        lastStyleShown = style;
        urlTransition = null;
        setGpuStatusLine(
          `WebGPU running · ${built.data.numBlocks.toLocaleString()} blocks · grid ${built.data.gridSize}×${built.data.gridSize}`,
        );
        return;
      }

      if (urlTransition) {
        const tLin = Math.min(1, urlTransition.progress);
        const snapshot = buildInterpolatedBlockData(
          urlTransition.from,
          urlTransition.to,
          tLin,
        );
        urlTransition = {
          from: cloneBlockData(snapshot),
          to: built.data,
          progress: 0,
          targetContent: built.normalizedContent,
        };
        return;
      }

      urlTransition = {
        from: cloneBlockData(lastBlockData),
        to: built.data,
        progress: 0,
        targetContent: built.normalizedContent,
      };
    };

    refreshQrImpl = refreshQr;

    let resizeRaf = 0;
    const applyResize = () => {
      if (!device || !context || aborted) return;
      const r = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(r.width * ratio));
      const h = Math.max(1, Math.floor(r.height * ratio));
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      configureWebGpuCanvas(context, device, format);
      depthTexture.destroy();
      depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    };

    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        applyResize();
      });
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    let ptrNormX = 0.5;
    let ptrNormY = 0.5;
    let ptrInfl = 0;
    let ptrInflTarget = 0;
    let ripple = 0;

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptrNormX = (e.clientX - r.left) / Math.max(r.width, 1);
      ptrNormY = (e.clientY - r.top) / Math.max(r.height, 1);
      ptrInflTarget = 1;
    };
    const onPointerLeave = () => {
      ptrInflTarget = 0;
    };
    const onPointerDown = () => {
      ripple = Math.min(1, ripple + 0.72);
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerdown', onPointerDown);

    const render = () => {
      animationId = requestAnimationFrame(render);
      if (aborted || !device || !context) return;

      const now = Date.now();
      if (tabHidden) {
        lastFrameTime = now;
        return;
      }

      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      const target = getIsFlat() ? 1 : 0;
      rawProgress += (target - rawProgress) * Math.min(1, LERP_SPEED * dt);
      if (Math.abs(rawProgress - target) < 0.001) rawProgress = target;
      progress = easeInOutCubic(rawProgress);

      if (urlTransition) {
        urlTransition.progress += dt / URL_BLOCK_TRANSITION_SEC;
        const tLin = Math.min(1, urlTransition.progress);
        const merged = buildInterpolatedBlockData(
          urlTransition.from,
          urlTransition.to,
          tLin,
        );
        updateBuffers(device, merged, blockBuffers);
        blockDataState = {
          numBlocks: merged.numBlocks,
          gridSize: merged.gridSize,
        };

        if (urlTransition.progress >= 1) {
          const finalData = urlTransition.to;
          updateBuffers(device, finalData, blockBuffers);
          lastBlockData = cloneBlockData(finalData);
          blockDataState = {
            numBlocks: finalData.numBlocks,
            gridSize: finalData.gridSize,
          };
          contentShown = urlTransition.targetContent;
          lastStyleShown = getVisualStyle();
          setGpuStatusLine(
            `WebGPU running · ${finalData.numBlocks.toLocaleString()} blocks · grid ${finalData.gridSize}×${finalData.gridSize}`,
          );
          urlTransition = null;
        }
      }

      const time = (now - startTime) / 1000;
      const { numBlocks, gridSize } = blockDataState;

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
        ? 1
        : 0;
      ptrInfl += (ptrInflTarget - ptrInfl) * Math.min(1, dt * 14);
      ripple *= Math.exp(-dt * 3.8);
      const ecoZ = ptrInfl * (1 - reducedMotion * 0.88);
      const ecoW = ripple * (1 - reducedMotion * 0.85);

      const aspectRatio = canvas.width / canvas.height;
      const style = getVisualStyle();
      const waterTop =
        style === 'reef' ? WATER_BOX_TOP_Y : 0.0;
      const styleFlag = style === 'reef' ? STYLE_REEF : STYLE_TREE;
      const uniformData = new Float32Array([
        aspectRatio,
        time,
        numBlocks,
        progress,
        gridSize,
        0,
        reducedMotion,
        waterTop,
        styleFlag,
        0,
        0,
        0,
        ptrNormX,
        ptrNormY,
        ecoZ,
        ecoW,
      ]);
      device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();

      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0.998, g: 0.998, b: 1.0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      });

      renderPass.setPipeline(skyPipeline);
      renderPass.setBindGroup(0, skyBindGroup);
      renderPass.draw(3);

      renderPass.setPipeline(shadowPipeline);
      renderPass.setBindGroup(0, skyBindGroup);
      renderPass.draw(6);

      renderPass.setPipeline(blocksPipeline);
      renderPass.setBindGroup(0, blocksBindGroup);
      renderPass.draw(36 * numBlocks);

      if (style === 'reef') {
        renderPass.setPipeline(reefParticlesPipeline);
        renderPass.setBindGroup(0, skyBindGroup);
        renderPass.draw(6 * REEF_PARTICLE_COUNT);

        renderPass.setPipeline(waterPipeline);
        renderPass.setBindGroup(0, skyBindGroup);
        renderPass.draw(36);
      } else {
        renderPass.setPipeline(leavesPipeline);
        renderPass.setBindGroup(0, skyBindGroup);
        renderPass.draw(6 * LEAF_COUNT);
      }

      renderPass.end();
      device.queue.submit([commandEncoder.finish()]);
    };

    const errPanel = document.getElementById('wgpu-error');
    if (errPanel) {
      errPanel.innerHTML = '';
      errPanel.hidden = true;
      errPanel.style.display = 'none';
    }

    setGpuStatusLine(
      `WebGPU running · ${initialData.numBlocks.toLocaleString()} blocks · grid ${initialData.gridSize}×${initialData.gridSize}`,
    );

    setQrFeedback('');
    render();

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      ro.disconnect();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (animationId !== null) cancelAnimationFrame(animationId);
      depthTexture.destroy();
      blockBuffers.typeBuffer.destroy();
      blockBuffers.posBuffer.destroy();
      blockBuffers.heightBuffer.destroy();
      blockBuffers.baseYBuffer.destroy();
    };
  };

  const timeoutId = window.setTimeout(() => {
    init()
      .then(fn => {
        if (aborted) return;
        if (typeof fn === 'function') cleanup = fn;
      })
      .catch(err => {
        console.error(err);
        showInitError(err);
      });
  }, 50);

  return {
    destroy: () => {
      aborted = true;
      clearTimeout(timeoutId);
      cleanup?.();
    },
    refreshQr: () => refreshQrImpl?.(),
  };
}

function updateBuffers(
  device: GPUDevice,
  blockData: BlockData,
  buffers: BlockBuffers,
) {
  const { types, positions, heights, baseY } = blockData;

  const paddedTypes = new Uint32Array(MAX_BLOCKS);
  paddedTypes.set(types);
  device.queue.writeBuffer(buffers.typeBuffer, 0, paddedTypes);

  const paddedPositions = new Float32Array(MAX_BLOCKS * 4);
  paddedPositions.set(positions);
  device.queue.writeBuffer(buffers.posBuffer, 0, paddedPositions);

  const paddedHeights = new Float32Array(MAX_BLOCKS);
  paddedHeights.set(heights);
  device.queue.writeBuffer(buffers.heightBuffer, 0, paddedHeights);

  const paddedBaseY = new Float32Array(MAX_BLOCKS);
  paddedBaseY.set(baseY);
  device.queue.writeBuffer(buffers.baseYBuffer, 0, paddedBaseY);
}

interface PipelineOptions {
  vertex: string;
  fragment: string;
  depthWrite: boolean;
  depthCompare: GPUCompareFunction;
  blend?: GPUBlendState;
}

async function validateShaderModule(module: GPUShaderModule, label: string) {
  if (typeof module.getCompilationInfo !== 'function') return;
  const info = await module.getCompilationInfo();
  const errors = info.messages.filter(m => m.type === 'error');
  if (errors.length > 0) {
    const text = errors
      .map(m => `line ${m.lineNum}: ${m.message}`)
      .join('\n');
    throw new Error(`WGSL error in ${label}:\n${text}`);
  }
}

async function createPipelineAsync(
  device: GPUDevice,
  format: GPUTextureFormat,
  bindGroupLayout: GPUBindGroupLayout,
  options: PipelineOptions,
): Promise<GPURenderPipeline> {
  const vsMod = device.createShaderModule({ code: options.vertex, label: 'vs' });
  const fsMod = device.createShaderModule({
    code: options.fragment,
    label: 'fs',
  });
  await validateShaderModule(vsMod, 'vertex');
  await validateShaderModule(fsMod, 'fragment');

  return device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    }),
    vertex: {
      module: vsMod,
      entryPoint: 'main',
    },
    fragment: {
      module: fsMod,
      entryPoint: 'main',
      targets: [
        options.blend !== undefined
          ? { format, blend: options.blend }
          : { format },
      ],
    },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: {
      depthWriteEnabled: options.depthWrite,
      depthCompare: options.depthCompare,
      format: 'depth24plus',
    },
  });
}
