export type VisualStyleId = 'tree' | 'reef';

export const VISUAL_STYLES: {
  id: VisualStyleId;
  label: string;
  short: string;
}[] = [
  { id: 'tree', label: 'Cherry tree', short: 'Tree' },
  { id: 'reef', label: 'Coral reef', short: 'Reef' },
];
