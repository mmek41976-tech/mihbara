
import { BrushType, Brush } from './types';

export const COLORS = {
  INK_BLACK: '#1C1B18',
  PARCHMENT_BEIGE: '#F3EAD9',
  WARM_BROWN: '#7A5C3E',
  MUTED_GOLD: '#C2A24D',
  SOFT_OLIVE: '#8A8F6A',
};

export const BLEND_MODES = [
  // Fix: Use 'source-over' for the blend mode, as 'normal' is invalid for Canvas's globalCompositeOperation.
  { id: 'source-over', name: 'عادي (Normal)' },
  { id: 'multiply', name: 'ضرب (Multiply)' },
  { id: 'screen', name: 'شاشة (Screen)' },
  { id: 'overlay', name: 'تراكب (Overlay)' },
  { id: 'darken', name: 'تغميق (Darken)' },
  { id: 'lighten', name: 'تفتيح (Lighten)' },
  { id: 'color-dodge', name: 'تفادي اللون (Color Dodge)' },
  { id: 'color-burn', name: 'حرق اللون (Color Burn)' },
  { id: 'hard-light', name: 'ضوء شديد (Hard Light)' },
  { id: 'soft-light', name: 'ضوء ناعم (Soft Light)' },
  { id: 'difference', name: 'فرق (Difference)' },
  { id: 'exclusion', name: 'استبعاد (Exclusion)' },
  { id: 'hue', name: 'صبغة (Hue)' },
  { id: 'saturation', name: 'تشبع (Saturation)' },
  { id: 'color', name: 'لون (Color)' },
  { id: 'luminosity', name: 'إضاءة (Luminosity)' },
];

export const TEXTURES = [
  { id: 'none', name: 'بدون (None)', url: '' },
  { id: 'grain', name: 'حبيبات (Grain)', url: 'https://www.transparenttextures.com/patterns/carbon-fibre.png' },
  { id: 'canvas', name: 'قماش (Canvas)', url: 'https://www.transparenttextures.com/patterns/canvas-orange.png' },
  { id: 'paper', name: 'ورق (Paper)', url: 'https://www.transparenttextures.com/patterns/handmade-paper.png' },
  { id: 'charcoal', name: 'فحم (Rough)', url: 'https://www.transparenttextures.com/patterns/asfalt-dark.png' },
];

export const CANVAS_PRESETS = [
  { id: 'a4', name: 'A4 (210x297mm)', width: 2480, height: 3508 },
  { id: 'square', name: 'مربع (Square)', width: 2048, height: 2048 },
  // Use static placeholders here to avoid side-effects on module load.
  // The ProjectModal component dynamically calculates the correct screen size at runtime.
  { id: 'screen', name: 'شاشة (Screen)', width: 1920, height: 1080 },
];

export const DEFAULT_BRUSHES: Brush[] = [
  // Set 1: Raster
  {
    id: 'b-pencil',
    name: 'قلم رصاص (Pencil)',
    type: BrushType.RASTER,
    isDefault: true,
    category: 'sketch',
    settings: {
      size: 5,
      angle: 0,
      roundness: 100,
      opacity: 0.8,
      pressureSensitivity: true,
      stabilization: 0,
      hardness: 0.8,
      minSize: 1,
      maxSize: 10,
      textureUrl: 'https://www.transparenttextures.com/patterns/handmade-paper.png',
      textureScale: 1
    }
  },
  {
    id: 'b-charcoal',
    name: 'قلم فحم (Charcoal Pencil)',
    type: BrushType.RASTER,
    isDefault: true,
    category: 'sketch',
    settings: {
      size: 15,
      angle: 0,
      roundness: 90,
      opacity: 0.7,
      pressureSensitivity: true,
      stabilization: 0.05,
      hardness: 0.5,
      minSize: 3,
      maxSize: 30,
      textureUrl: 'https://www.transparenttextures.com/patterns/asfalt-dark.png',
      textureScale: 1
    }
  },
  {
    id: 'b-soft-sketch',
    name: 'اسكتش ناعم (Soft Sketch)',
    type: BrushType.RASTER,
    isDefault: true,
    category: 'sketch',
    settings: {
      size: 20,
      angle: 0,
      roundness: 100,
      opacity: 0.4,
      pressureSensitivity: true,
      stabilization: 0,
      hardness: 0.2,
      minSize: 5,
      maxSize: 40,
    }
  },
  {
    id: 'b-ink',
    name: 'حبر (Ink)',
    type: BrushType.RASTER,
    isDefault: true,
    category: 'sketch',
    settings: {
      size: 8,
      angle: 0,
      roundness: 100,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.02,
      hardness: 1,
      minSize: 2,
      maxSize: 15,
    }
  },
  // Set 2: Calligraphy
  {
    id: 'b-reed-pen',
    name: 'قلم قصب (Reed Pen)',
    type: BrushType.VECTOR_CALLIGRAPHY,
    isDefault: true,
    category: 'calligraphy',
    settings: {
      size: 30,
      angle: 60,
      roundness: 15,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.1,
      hardness: 1,
      minSize: 5,
      maxSize: 80,
    }
  },
  {
    id: 'b-cal-thin',
    name: 'خطاط رفيع (Calligraphy Thin)',
    type: BrushType.VECTOR_CALLIGRAPHY,
    isDefault: true,
    category: 'calligraphy',
    settings: {
      size: 15,
      angle: 45,
      roundness: 20,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.05,
      hardness: 1,
      minSize: 10,
      maxSize: 25,
    }
  },
  {
    id: 'b-cal-med',
    name: 'خطاط متوسط (Calligraphy Med)',
    type: BrushType.VECTOR_CALLIGRAPHY,
    isDefault: true,
    category: 'calligraphy',
    settings: {
      size: 30,
      angle: 45,
      roundness: 15,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.08,
      hardness: 1,
      minSize: 20,
      maxSize: 50,
    }
  },
  {
    id: 'b-cal-bold',
    name: 'خطاط عريض (Calligraphy Bold)',
    type: BrushType.VECTOR_CALLIGRAPHY,
    isDefault: true,
    category: 'calligraphy',
    settings: {
      size: 60,
      angle: 45,
      roundness: 10,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.1,
      hardness: 1,
      minSize: 40,
      maxSize: 100,
    }
  }
];

export const LIBRARY_BRUSHES: Brush[] = [
  {
    id: 'lib-diwani',
    name: 'قلم ديواني (Diwani Pen)',
    type: BrushType.VECTOR_CALLIGRAPHY,
    isDefault: false,
    category: 'library',
    settings: {
      size: 40,
      angle: 30,
      roundness: 12,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.1,
      hardness: 1,
      minSize: 20,
      maxSize: 70,
    }
  },
  {
    id: 'lib-thuluth',
    name: 'قلم ثلث (Thuluth Pen)',
    type: BrushType.VECTOR_CALLIGRAPHY,
    isDefault: false,
    category: 'library',
    settings: {
      size: 55,
      angle: 75,
      roundness: 8,
      opacity: 1,
      pressureSensitivity: true,
      stabilization: 0.15,
      hardness: 1,
      minSize: 30,
      maxSize: 120,
    }
  }
];
