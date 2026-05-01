import * as react_jsx_runtime from 'react/jsx-runtime';
import * as react from 'react';

interface ImageSession {
    id: string;
    thumbnail: string;
    originalImage: string;
    timestamp: number;
}
interface LuminateEditorProps {
    apiEndpoint?: string;
    onExport?: (dataUrl: string) => void;
}
declare function LuminateEditor({ apiEndpoint, onExport, }: LuminateEditorProps): react_jsx_runtime.JSX.Element;

interface EditParams {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    sharpness?: number;
    warmth?: number;
    exposure?: number;
    highlights?: number;
    shadows?: number;
    rotation?: number;
    flipX?: boolean;
    flipY?: boolean;
    crop?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
interface AIEditResponse {
    params: EditParams;
    explanation: string;
}
interface WatermarkConfig {
    text?: string;
    imageUrl?: string;
    opacity: number;
    scale: number;
}
interface WatermarkOverlay {
    config: WatermarkConfig;
    xPercent: number;
    yPercent: number;
}
interface LuminateConfig {
    aiProvider: "gemini" | "openai" | "claude";
    apiKey?: string;
    apiEndpoint?: string;
}
interface EditorState {
    originalImage: string | null;
    currentParams: EditParams;
    history: EditParams[];
    historyIndex: number;
    isProcessing: boolean;
    backgroundRemoved: boolean;
}
declare const DEFAULT_EDIT_PARAMS: EditParams;
interface LogoPlacement {
    imageBase64: string;
    mimeType: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    xPercent: number;
    yPercent: number;
    scale: number;
    opacity: number;
}

interface CanvasProps {
    imageSrc: string | null;
    params: EditParams;
    backgroundRemovedSrc?: string | null;
    cropMode?: boolean;
    onCropComplete?: (dataUrl: string) => void;
    onCropCancel?: () => void;
    showOriginal?: boolean;
    watermark?: WatermarkOverlay | null;
    onWatermarkMove?: (xPercent: number, yPercent: number) => void;
    watermarkSelected?: boolean;
}
interface CanvasHandle {
    exportImage: () => string | null;
}
declare const Canvas: react.ForwardRefExoticComponent<CanvasProps & react.RefAttributes<CanvasHandle>>;

interface ToolbarProps {
    params: EditParams;
    onUpdateParams: (params: Partial<EditParams>) => void;
    disabled?: boolean;
    cropMode?: boolean;
    onToggleCrop?: () => void;
}
declare function Toolbar({ params, onUpdateParams, disabled, cropMode, onToggleCrop, }: ToolbarProps): react_jsx_runtime.JSX.Element;

type AgentEventType = "thinking" | "tool_call" | "tool_result" | "params_update" | "logo_update" | "complete" | "error";
interface AgentEvent {
    type: AgentEventType;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    description?: string;
    reasoning?: string;
    currentParams?: EditParams;
    logoPlacement?: LogoPlacement;
    explanation?: string;
    error?: string;
}

interface AIChatProps {
    onSubmit: (instruction: string) => Promise<void>;
    onAgentEdit?: (instruction: string, logoBase64?: string, logoMimeType?: string) => Promise<void>;
    isProcessing: boolean;
    lastExplanation?: string;
    lastParams?: EditParams | null;
    previousParams?: EditParams | null;
    hasImage?: boolean;
    agentSteps?: AgentEvent[];
}
declare function AIChat({ onSubmit, onAgentEdit, isProcessing, lastExplanation, lastParams, previousParams, hasImage, agentSteps, }: AIChatProps): react_jsx_runtime.JSX.Element;

interface BackgroundRemovalProps {
    imageSrc: string | null;
    isRemoved: boolean;
    onRemove: (resultDataUrl: string) => void;
    onRestore: () => void;
    disabled?: boolean;
}
declare function BackgroundRemoval({ imageSrc, isRemoved, onRemove, onRestore, disabled, }: BackgroundRemovalProps): react_jsx_runtime.JSX.Element;

interface WatermarkPanelProps {
    watermark: WatermarkOverlay | null;
    onAdd: (type: "text" | "image", content: string) => void;
    onUpdate: (updates: Partial<WatermarkOverlay["config"]>) => void;
    onRemove: () => void;
    disabled?: boolean;
}
declare function WatermarkPanel({ watermark, onAdd, onUpdate, onRemove, disabled, }: WatermarkPanelProps): react_jsx_runtime.JSX.Element;

interface ImageUploadProps {
    onImageLoad: (dataUrl: string) => void;
}
declare function ImageUpload({ onImageLoad }: ImageUploadProps): react_jsx_runtime.JSX.Element;

interface HomeScreenProps {
    onImageLoad: (dataUrl: string) => void;
    sessions?: ImageSession[];
    onRestoreSession?: (session: ImageSession) => void;
}
declare function HomeScreen({ onImageLoad, sessions, onRestoreSession }: HomeScreenProps): react_jsx_runtime.JSX.Element;

declare function useEditorState(): {
    state: EditorState;
    setImage: (dataUrl: string) => void;
    clearImage: () => void;
    updateParams: (newParams: Partial<EditParams>) => void;
    setParams: (params: EditParams) => void;
    undo: () => void;
    redo: () => void;
    reset: () => void;
    setProcessing: (isProcessing: boolean) => void;
    setBackgroundRemoved: (backgroundRemoved: boolean) => void;
};

export { AIChat, type AIEditResponse, BackgroundRemoval, Canvas, DEFAULT_EDIT_PARAMS, type EditParams, type EditorState, HomeScreen, ImageUpload, type LuminateConfig, LuminateEditor, Toolbar, type WatermarkConfig, WatermarkPanel, useEditorState };
