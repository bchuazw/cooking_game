// Background and container colors
export const COLORS = {
  background: '#e8f4fc',
} as const;

export const CONTAINER_BG = COLORS.background;
export const DEFAULT_QR_CONTENT =
  'https://bchuazw.github.io/cooking_game/?play=1';

// Color palette for lighting — coral reef (underwater)
export const PALETTE = {
  skyZenith: { r: 0.55, g: 0.75, b: 0.95 },
  skyHorizon: { r: 0.75, g: 0.88, b: 0.98 },
  sun: { r: 0.85, g: 0.95, b: 1.0 },
  skyFill: { r: 0.45, g: 0.65, b: 0.88 },
  bounce: { r: 0.25, g: 0.45, b: 0.55 },
} as const;

/** Cherry tree 3D style — warmer daylight */
export const TREE_PALETTE = {
  skyZenith: { r: 0.82, g: 0.88, b: 0.92 },
  skyHorizon: { r: 0.91, g: 0.93, b: 0.91 },
  sun: { r: 1.15, g: 1.05, b: 0.95 },
  skyFill: { r: 0.85, g: 0.9, b: 0.95 },
  bounce: { r: 0.5, g: 0.65, b: 0.42 },
} as const;

// Block/cube dimensions
export const BLOCK_SIZE = 0.0245;
export const CUBE_HEIGHT = BLOCK_SIZE;

/** Water volume AABB (world Y); bottom slightly below sand tops to avoid cracks. */
export const WATER_BOX_BOTTOM_Y = CUBE_HEIGHT * 0.88;
/** Top of water column — passed to GPU as `scene.w` for the water box. */
export const WATER_BOX_TOP_Y = CUBE_HEIGHT + 0.4;

// Cherry tree structure (3D style)
export const TRUNK_RADIUS = 2.5;
export const TRUNK_LAYERS = 12;
export const MAX_CANOPY_LAYERS = 12;
export const CANOPY_OUTER_RADIUS_FACTOR = 0.46;

// Grid limits
export const MAX_GRID_SIZE = 41;
export const MAX_BLOCKS = MAX_GRID_SIZE * MAX_GRID_SIZE * 18;

// Camera angles for 3D isometric view
export const ISO_ANGLE_Y = 0.78;
export const ISO_ANGLE_X = -0.55;

// Camera angles for 2D flat view (top-down for QR scanning)
export const FLAT_ANGLE_Y = 0.0;
export const FLAT_ANGLE_X = -1.5708; // -π/2

// Animation
export const LERP_SPEED = 6.5;

/** URL change: staggered ripple — centre blocks first, edge blocks last. */
export const URL_BLOCK_TRANSITION_SEC = 1.4;

// View scaling
export const VIEW_SCALE_3D = 1.6;
export const VIEW_SCALE_2D = 2.1;

// Centering offsets for 2D view (0 = centered)
export const Y_OFFSET_2D = 0;
export const X_OFFSET_2D = 0;

/** Sakura petals when style is tree; 6 verts per leaf. */
export const LEAF_COUNT = 420;

/** Plankton + bubbles in reef 3D water; 6 verts per particle quad. */
export const REEF_PARTICLE_COUNT = 320;

/** GPU: `theme.x` — 0 = cherry tree, 1 = coral reef */
export const STYLE_TREE = 0;
export const STYLE_REEF = 1;
