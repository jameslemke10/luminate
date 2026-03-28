"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  SlidersHorizontal,
  Stamp,
  Sparkles,
  Undo2,
  Redo2,
  RefreshCw,
  Download,
  Plus,
  Eye,
  GripVertical,
  LayoutGrid,
} from "lucide-react";
import { useEditorState } from "../hooks/useEditorState";
import { AIEditResponse, EditParams, WatermarkOverlay } from "../types";
import { HomeScreen } from "./HomeScreen";
import { Canvas, CanvasHandle } from "./Canvas";
import { Toolbar } from "./Toolbar";
import { AIChat } from "./AIChat";
import { BackgroundRemoval } from "./BackgroundRemoval";
import { WatermarkPanel } from "./WatermarkPanel";

type Tab = "adjust" | "watermark" | "ai";

export interface ImageSession {
  id: string;
  thumbnail: string;
  originalImage: string;
  timestamp: number;
}

interface LuminateEditorProps {
  apiEndpoint?: string;
  onExport?: (dataUrl: string) => void;
}

export function LuminateEditor({
  apiEndpoint = "/api/ai-edit",
  onExport,
}: LuminateEditorProps) {
  const canvasRef = useRef<CanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state, setImage, clearImage, updateParams, setParams, undo, redo, reset, setProcessing, setBackgroundRemoved,
  } = useEditorState();

  const [activeTab, setActiveTab] = useState<Tab>("ai");
  const [bgRemovedSrc, setBgRemovedSrc] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string>();
  const [lastAIParams, setLastAIParams] = useState<EditParams | null>(null);
  const [preAIParams, setPreAIParams] = useState<EditParams | null>(null);
  const [watermark, setWatermark] = useState<WatermarkOverlay | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Image sessions (history)
  const [sessions, setSessions] = useState<ImageSession[]>([]);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const hasImage = !!state.originalImage;

  // Delete key removes watermark
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && watermark) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setWatermark(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [watermark]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      setSidebarWidth(Math.max(280, Math.min(600, resizeRef.current.startWidth + (resizeRef.current.startX - e.clientX))));
    };
    const handleUp = () => { setIsResizing(false); resizeRef.current = null; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [isResizing]);

  // Generate thumbnail from data URL
  const makeThumbnail = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const size = 120;
        const aspect = img.naturalWidth / img.naturalHeight;
        const w = aspect > 1 ? size : size * aspect;
        const h = aspect > 1 ? size / aspect : size;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.6));
      };
      img.src = dataUrl;
    });
  }, []);

  const resetEditorState = useCallback(() => {
    setBgRemovedSrc(null); setWatermark(null); setCropMode(false); setShowOriginal(false);
    setLastExplanation(undefined); setLastAIParams(null); setPreAIParams(null);
  }, []);

  const handleLoadImage = useCallback(
    async (dataUrl: string) => {
      // Save current image to history if exists
      if (state.originalImage) {
        const thumb = await makeThumbnail(state.originalImage);
        setSessions((prev) => {
          const existing = prev.find((s) => s.originalImage === state.originalImage);
          if (existing) return prev;
          return [...prev, { id: crypto.randomUUID(), thumbnail: thumb, originalImage: state.originalImage!, timestamp: Date.now() }];
        });
      }
      setImage(dataUrl);
      resetEditorState();
    },
    [state.originalImage, setImage, makeThumbnail, resetEditorState]
  );

  const handleRestoreSession = useCallback(
    async (session: ImageSession) => {
      // Save current to history first
      if (state.originalImage && state.originalImage !== session.originalImage) {
        const thumb = await makeThumbnail(state.originalImage);
        setSessions((prev) => {
          const existing = prev.find((s) => s.originalImage === state.originalImage);
          if (existing) return prev;
          return [...prev, { id: crypto.randomUUID(), thumbnail: thumb, originalImage: state.originalImage!, timestamp: Date.now() }];
        });
      }
      setImage(session.originalImage);
      resetEditorState();
    },
    [state.originalImage, setImage, makeThumbnail, resetEditorState]
  );

  const handleAIEdit = useCallback(
    async (instruction: string) => {
      if (!state.originalImage) return;
      setProcessing(true); setLastExplanation(undefined);
      setPreAIParams({ ...state.currentParams }); setLastAIParams(null);
      try {
        const match = state.originalImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error("Invalid image data");
        const [, mimeType, imageBase64] = match;
        const res = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType, instruction }) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "AI request failed"); }
        const result: AIEditResponse = await res.json();
        setParams(result.params); setLastAIParams(result.params); setLastExplanation(result.explanation);
      } catch (error) {
        setLastExplanation(`Error: ${error instanceof Error ? error.message : "Failed"}`);
      } finally { setProcessing(false); }
    },
    [state.originalImage, state.currentParams, apiEndpoint, setParams, setProcessing]
  );

  const handleMatchTemplate = useCallback(
    async (referenceDataUrl: string) => {
      if (!state.originalImage) return;
      setProcessing(true); setLastExplanation(undefined);
      setPreAIParams({ ...state.currentParams }); setLastAIParams(null);
      try {
        const tm = state.originalImage.match(/^data:(image\/\w+);base64,(.+)$/);
        const rm = referenceDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!tm || !rm) throw new Error("Invalid image data");
        const [, mimeType, imageBase64] = tm;
        const [, referenceMimeType, referenceBase64] = rm;
        const res = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64, mimeType, referenceBase64, referenceMimeType }) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Template match failed"); }
        const result: AIEditResponse = await res.json();
        setParams(result.params); setLastAIParams(result.params); setLastExplanation(result.explanation);
      } catch (error) {
        setLastExplanation(`Error: ${error instanceof Error ? error.message : "Failed"}`);
      } finally { setProcessing(false); }
    },
    [state.originalImage, state.currentParams, apiEndpoint, setParams, setProcessing]
  );

  const handleExport = useCallback(() => {
    const dataUrl = canvasRef.current?.exportImage();
    if (dataUrl) {
      if (onExport) onExport(dataUrl);
      else { const link = document.createElement("a"); link.download = "luminate-export.png"; link.href = dataUrl; link.click(); }
    }
  }, [onExport]);

  const handleAddWatermark = useCallback((type: "text" | "image", content: string) => {
    setWatermark({
      config: { text: type === "text" ? content : undefined, imageUrl: type === "image" ? content : undefined, opacity: 0.7, scale: 0.2 },
      xPercent: 40, yPercent: 40,
    });
  }, []);

  const handleUpdateWatermark = useCallback(
    (updates: Partial<WatermarkOverlay["config"]>) => {
      setWatermark((prev) => prev ? { ...prev, config: { ...prev.config, ...updates } } : null);
    }, []
  );

  const handleWatermarkMove = useCallback(
    (xPercent: number, yPercent: number) => {
      setWatermark((prev) => prev ? { ...prev, xPercent, yPercent } : null);
    }, []
  );

  const handleBackgroundRemove = useCallback(
    (resultDataUrl: string) => { setBgRemovedSrc(resultDataUrl); setBackgroundRemoved(true); },
    [setBackgroundRemoved]
  );
  const handleBackgroundRestore = useCallback(() => { setBgRemovedSrc(null); setBackgroundRemoved(false); }, [setBackgroundRemoved]);

  const handleReset = useCallback(() => { reset(); resetEditorState(); }, [reset, resetEditorState]);

  // Crop now receives a data URL directly from the canvas
  const handleCropComplete = useCallback(
    (croppedDataUrl: string) => {
      setImage(croppedDataUrl);
      setCropMode(false);
      setBgRemovedSrc(null);
    },
    [setImage]
  );

  const handleGoHome = useCallback(async () => {
    if (state.originalImage) {
      const thumb = await makeThumbnail(state.originalImage);
      setSessions((prev) => {
        if (prev.find((s) => s.originalImage === state.originalImage)) return prev;
        return [...prev, { id: crypto.randomUUID(), thumbnail: thumb, originalImage: state.originalImage!, timestamp: Date.now() }];
      });
    }
    clearImage();
    resetEditorState();
  }, [state.originalImage, clearImage, makeThumbnail, resetEditorState]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "ai", label: "AI", icon: <Sparkles className="w-4 h-4" /> },
    { id: "adjust", label: "Adjust", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: "watermark", label: "Watermark", icon: <Stamp className="w-4 h-4" /> },
  ];

  if (!hasImage) {
    return (
      <HomeScreen
        onImageLoad={handleLoadImage}
        sessions={sessions}
        onRestoreSession={handleRestoreSession}
      />
    );
  }

  return (
    <div className="flex h-full select-none">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { if (ev.target?.result) handleLoadImage(ev.target.result as string); }; r.readAsDataURL(f); } }} />

      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0 p-4">
        <div className="flex-1 relative">
          <Canvas
            ref={canvasRef}
            imageSrc={state.originalImage}
            params={state.currentParams}
            backgroundRemovedSrc={bgRemovedSrc}
            cropMode={cropMode}
            onCropComplete={handleCropComplete}
            onCropCancel={() => setCropMode(false)}
            showOriginal={showOriginal}
            watermark={watermark}
            onWatermarkMove={handleWatermarkMove}
            watermarkSelected={activeTab === "watermark" && !!watermark}
          />
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              className={`p-2 rounded-lg shadow-sm border transition-colors ${showOriginal ? "bg-blue-600 border-blue-600 text-white" : "bg-white/90 border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-white"}`}
              title="Hold to see original"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg shadow-sm border bg-white/90 border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-white transition-colors"
              title="New image"
            >
              <Plus className="w-4 h-4" />
            </button>
            {sessions.length > 0 && (
              <button
                onClick={handleGoHome}
                className="p-2 rounded-lg shadow-sm border bg-white/90 border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-white transition-colors"
                title="All images"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div className={`w-1.5 flex items-center justify-center cursor-col-resize hover:bg-blue-100 transition-colors group ${isResizing ? "bg-blue-200" : ""}`}
        onMouseDown={(e) => { setIsResizing(true); resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }; }}>
        <GripVertical className="w-3 h-3 text-zinc-300 group-hover:text-blue-400" />
      </div>

      {/* Right sidebar */}
      <div className="border-l border-zinc-200 bg-white flex flex-col" style={{ width: sidebarWidth }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
          <div className="flex items-center gap-0.5">
            <button onClick={undo} disabled={state.historyIndex <= 0}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors" title="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={state.historyIndex >= state.history.length - 1}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors" title="Redo">
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            <button onClick={handleReset}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors" title="Reset all">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <div className="flex border-b border-zinc-200">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"}`}>
              {tab.icon} {tab.label}
              {activeTab === tab.id && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "adjust" && (
            <div className="flex flex-col">
              <Toolbar params={state.currentParams} onUpdateParams={updateParams} cropMode={cropMode}
                onToggleCrop={() => setCropMode((v) => !v)} />
              <div className="px-4 pb-4">
                <BackgroundRemoval imageSrc={state.originalImage} isRemoved={state.backgroundRemoved}
                  onRemove={handleBackgroundRemove} onRestore={handleBackgroundRestore} />
              </div>
            </div>
          )}
          {activeTab === "watermark" && (
            <div className="p-4">
              <WatermarkPanel watermark={watermark} onAdd={handleAddWatermark}
                onUpdate={handleUpdateWatermark} onRemove={() => setWatermark(null)} />
            </div>
          )}
          {activeTab === "ai" && (
            <div className="p-4">
              <AIChat onSubmit={handleAIEdit} onMatchTemplate={handleMatchTemplate}
                isProcessing={state.isProcessing} lastExplanation={lastExplanation}
                lastParams={lastAIParams} previousParams={preAIParams} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
