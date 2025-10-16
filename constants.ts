
import type { AspectRatio } from './types';

export const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Dọc (9:16)', value: '9:16' },
  { label: 'Ngang (16:9)', value: '16:9' },
  { label: 'Vuông (1:1)', value: '1:1' },
  { label: 'Cổ điển (4:3)', value: '4:3' },
  { label: 'YouTube (16:9)', value: '16:9' },
  { label: 'TikTok (9:16)', value: '9:16' },
  { label: 'Facebook (1:1)', value: '1:1' },
];

export const GENERATION_LIMIT = 50;
export const SESSION_STORAGE_GENERATION_COUNT_KEY = 'ai-character-generation-count';
