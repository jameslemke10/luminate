// Core types for the Luminate photo editor

export interface EditParams {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  sharpness?: number; // 0 to 100
  warmth?: number; // -100 to 100
  exposure?: number; // -100 to 100 (gamma curve)
  highlights?: number; // -100 to 100
  shadows?: number; // -100 to 100
  rotation?: number; // degrees
  flipX?: boolean;
  flipY?: boolean;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AIEditResponse {
  params: EditParams;
  explanation: string;
}

export interface WatermarkConfig {
  text?: string;
  imageUrl?: string;
  opacity: number; // 0 to 1
  scale: number; // 0.05 to 1
}

// Live watermark overlay state (position is in % of canvas)
export interface WatermarkOverlay {
  config: WatermarkConfig;
  xPercent: number;
  yPercent: number;
}

export interface LuminateConfig {
  aiProvider: "gemini" | "openai" | "claude";
  apiKey?: string;
  apiEndpoint?: string;
}

export interface EditorState {
  originalImage: string | null;
  currentParams: EditParams;
  history: EditParams[];
  historyIndex: number;
  isProcessing: boolean;
  backgroundRemoved: boolean;
}

export const DEFAULT_EDIT_PARAMS: EditParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  warmth: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  rotation: 0,
  flipX: false,
  flipY: false,
};

// Generic overlay layer
export interface Overlay {
  id: string;
  type: "rectangle" | "image";
  xPercent: number;      // 0-100, top-left corner
  yPercent: number;      // 0-100, top-left corner
  widthPercent: number;  // 0-100, size relative to image
  heightPercent: number; // 0-100, size relative to image
  color: string;         // hex color e.g. "#ffffff"
  opacity: number;       // 0-1
  imageBase64?: string;  // for image overlays
  imageMimeType?: string;
}
