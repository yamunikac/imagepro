export type FilterType =
  | 'none'
  | 'grayscale'
  | 'blur'
  | 'edge-detection'
  | 'sharpen'
  | 'brightness-contrast'
  | 'rotate'
  | 'resize'
  | 'cartoon'
  | 'invert'
  | 'sepia'
  | 'pixelate'
  | 'emboss';

export interface ProcessingParams {
  blurRadius?: number;
  brightness?: number;
  contrast?: number;
  rotateAngle?: number;
  resizeWidth?: number;
  resizeHeight?: number;
  keepAspectRatio?: boolean;
  pixelateSize?: number;
}

export interface HistoryEntry {
  id: string;
  filterType: FilterType;
  params: ProcessingParams;
  imageDataUrl: string;
  label: string;
  timestamp: number;
}

export interface Tool {
  id: FilterType;
  label: string;
  description: string;
  icon: string;
  category: 'basic' | 'filters' | 'transform' | 'effects';
  hasControls: boolean;
}

export const TOOLS: Tool[] = [
  // Basic
  { id: 'none', label: 'Original', description: 'Show original image', icon: '🖼️', category: 'basic', hasControls: false },
  { id: 'grayscale', label: 'Grayscale', description: 'Convert to black & white', icon: '⚫', category: 'basic', hasControls: false },
  { id: 'invert', label: 'Invert', description: 'Invert all colors', icon: '🔄', category: 'basic', hasControls: false },
  { id: 'sepia', label: 'Sepia', description: 'Vintage sepia tone', icon: '🟤', category: 'filters', hasControls: false },

  // Filters
  { id: 'blur', label: 'Gaussian Blur', description: 'Smooth the image', icon: '💧', category: 'filters', hasControls: true },
  { id: 'sharpen', label: 'Sharpen', description: 'Enhance image sharpness', icon: '✨', category: 'filters', hasControls: false },
  { id: 'edge-detection', label: 'Edge Detection', description: 'Canny-style edge detection', icon: '🔍', category: 'filters', hasControls: false },
  { id: 'emboss', label: 'Emboss', description: '3D emboss effect', icon: '🗿', category: 'effects', hasControls: false },

  // Transform
  { id: 'rotate', label: 'Rotate', description: 'Rotate to any angle', icon: '🔃', category: 'transform', hasControls: true },
  { id: 'resize', label: 'Resize', description: 'Change image dimensions', icon: '📐', category: 'transform', hasControls: true },

  // Effects
  { id: 'brightness-contrast', label: 'Brightness & Contrast', description: 'Adjust exposure', icon: '☀️', category: 'effects', hasControls: true },
  { id: 'cartoon', label: 'Cartoon Effect', description: 'Stylize as cartoon', icon: '🎨', category: 'effects', hasControls: false },
  { id: 'pixelate', label: 'Pixelate', description: 'Mosaic / pixel art', icon: '🟥', category: 'effects', hasControls: true },
];

export const TOOL_CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'filters', label: 'Filters' },
  { id: 'transform', label: 'Transform' },
  { id: 'effects', label: 'Effects' },
] as const;
