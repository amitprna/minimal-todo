// Shared initial data to avoid circular imports between App.jsx and useCloudStore.ts
export const CATEGORY_COLORS = [
  'var(--color-sage)',
  'var(--color-slate)',
  'var(--color-sand)',
  'var(--color-clay)',
  'var(--color-rose)',
  'var(--color-peach)',
];

export const COLOR_SWATCHES = [
  { label: 'Sage',  value: 'var(--color-sage)',  hex: '#6fa664' },
  { label: 'Slate', value: 'var(--color-slate)', hex: '#6d8fa3' },
  { label: 'Sand',  value: 'var(--color-sand)',  hex: '#c4aa8f' },
  { label: 'Clay',  value: 'var(--color-clay)',  hex: '#b8714f' },
  { label: 'Rose',  value: 'var(--color-rose)',  hex: '#c8788a' },
  { label: 'Peach', value: 'var(--color-peach)', hex: '#e88a66' },
];

export const initialCategories = [
  { id: '1', name: 'Personal', color: 'var(--color-sage)' },
  { id: '2', name: 'Work', color: 'var(--color-slate)' },
  { id: '3', name: 'Groceries', color: 'var(--color-sand)' },
  { id: '4', name: 'Projects', color: 'var(--color-clay)' },
  { id: '5', name: 'Ideas', color: 'var(--color-rose)' },
];
