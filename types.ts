
export enum BrushType {
  RASTER = 'RASTER',
  VECTOR_CALLIGRAPHY = 'VECTOR_CALLIGRAPHY'
}

export enum ToolType {
  PEN = 'PEN',
  ERASER = 'ERASER',
  HAND = 'HAND'
}

export interface UserSettings {
  language: 'ar' | 'en';
  autoSave: boolean;
  showGrid: boolean;
  uiScale: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
  settings: UserSettings;
}

export interface BrushSettings {
  size: number;
  angle: number;
  roundness: number;
  opacity: number;
  pressureSensitivity: boolean;
  stabilization: number;
  hardness: number;
  minSize: number;
  maxSize: number;
  textureUrl?: string;
  textureScale?: number;
}

export interface Brush {
  id: string;
  name: string;
  type: BrushType;
  settings: BrushSettings;
  isDefault?: boolean;
  category: 'sketch' | 'calligraphy' | 'custom' | 'library';
}

export interface BrushCollection {
  id: string;
  name: string;
  brushIds: string[];
}

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  brushId: string;
  brushSettings: BrushSettings;
  color: string;
  points: Point[];
  layerId: string;
}

export interface Layer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  opacity: number;
  blendMode: string;
  type: 'drawing' | 'image';
  imageUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundTextureUrl?: string;
  layers: Layer[];
  strokes: Stroke[];
  lastModified: number;
  thumbnail?: string;
  ownerId?: string;
}
