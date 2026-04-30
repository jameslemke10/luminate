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
  Upload,
} from "lucide-react";
import { useEditorState } from "../hooks/useEditorState";
import { AIEditResponse, EditParams, WatermarkOverlay } from "../types";
import { AgentEvent } from "../agent/types";
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
    state, setImage, updateParams, setParams, undo, redo, reset, setProcessing, setBackgroundRemoved,
  } = useEditorState();

  const [activeTab, setActiveTab] = useState<Tab>("ai");
  const [bgRemovedSrc, setBgRemovedSrc] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string>();
  const [lastAIParams, setLastAIParams] = useState<EditParams | null>(null);
  const [preAIParams, setPreAIParams] = useState<EditParams | null>(null);
  const [watermark, setWatermark] = useState<WatermarkOverlay | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Image sessions (multi-photo)
  const [sessions, setSessions] = useState<ImageSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [agentSteps, setAgentSteps] = useState<AgentEvent[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(400);
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
    setLastExplanation(undefined); setLastAIParams(null); setPreAIParams(null); setAgentSteps([]);
  }, []);

  // Load a single image and add it to sessions
  const handleLoadImage = useCallback(
    async (dataUrl: string) => {
      const thumb = await makeThumbnail(dataUrl);
      const id = crypto.randomUUID();
      setSessions((prev) => [...prev, { id, thumbnail: thumb, originalImage: dataUrl, timestamp: Date.now() }]);
      setActiveSessionId(id);
      setImage(dataUrl);
      resetEditorState();
    },
    [setImage, makeThumbnail, resetEditorState]
  );

  // Load multiple files at once
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArr.length === 0) return;
      // Load the first one immediately, queue the rest
      fileArr.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            if (idx === 0) {
              handleLoadImage(dataUrl);
            } else {
              // Add to sessions only
              makeThumbnail(dataUrl).then((thumb) => {
                setSessions((prev) => [...prev, {
                  id: crypto.randomUUID(),
                  thumbnail: thumb,
                  originalImage: dataUrl,
                  timestamp: Date.now(),
                }]);
              });
            }
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [handleLoadImage, makeThumbnail]
  );

  const handleSwitchSession = useCallback(
    (session: ImageSession) => {
      if (session.id === activeSessionId) return;
      setActiveSessionId(session.id);
      setImage(session.originalImage);
      resetEditorState();
    },
    [activeSessionId, setImage, resetEditorState]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
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

  const handleAgentEdit = useCallback(
    async (instruction: string, logoBase64?: string, logoMimeType?: string) => {
      if (!state.originalImage) return;
      setProcessing(true);
      setAgentSteps([]);
      setLastExplanation(undefined);
      setPreAIParams({ ...state.currentParams });
      setLastAIParams(null);

      try {
        const match = state.originalImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!match) throw new Error("Invalid image data");
        const [, mimeType, imageBase64] = match;

        const res = await fetch("/api/agent-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64, mimeType, instruction,
            currentParams: state.currentParams,
            logoImageBase64: logoBase64, logoMimeType,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Agent request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            try {
              const event: AgentEvent = JSON.parse(json);
              setAgentSteps((prev) => [...prev, event]);

              if (event.type === "params_update" && event.currentParams) {
                setParams(event.currentParams);
                setLastAIParams(event.currentParams);
              }
              if (event.type === "logo_update" && event.logoPlacement) {
                const lp = event.logoPlacement;
                setWatermark({
                  config: {
                    imageUrl: `data:${lp.mimeType};base64,${lp.imageBase64}`,
                    opacity: lp.opacity, scale: lp.scale,
                  },
                  xPercent: lp.xPercent, yPercent: lp.yPercent,
                });
              }
              if (event.type === "complete") setLastExplanation(event.explanation);
              if (event.type === "error") setLastExplanation(`Error: ${event.error}`);
            } catch { /* skip malformed */ }
          }
        }
      } catch (error) {
        setLastExplanation(`Error: ${error instanceof Error ? error.message : "Failed"}`);
        setAgentSteps((prev) => [...prev, { type: "error", error: error instanceof Error ? error.message : "Failed" }]);
      } finally {
        setProcessing(false);
      }
    },
    [state.originalImage, state.currentParams, setParams, setProcessing]
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

  const handleCropComplete = useCallback(
    (croppedDataUrl: string) => {
      setImage(croppedDataUrl);
      setCropMode(false);
      setBgRemovedSrc(null);
    },
    [setImage]
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "ai", label: "AI", icon: <Sparkles className="w-4 h-4" /> },
    { id: "adjust", label: "Adjust", icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: "watermark", label: "Watermark", icon: <Stamp className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-full">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files); e.target.value = ""; }} />

      {/* Left area: canvas or upload */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Photo strip - shown when there are multiple sessions */}
        {sessions.length > 1 && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => handleSwitchSession(s)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  s.id === activeSessionId ? "border-blue-500 shadow-md" : "border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100"
                }`}>
                <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            <button onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-zinc-300 hover:border-blue-400 flex items-center justify-center text-zinc-400 hover:text-blue-500 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 p-4 select-none">
          {hasImage ? (
            <div className="h-full relative">
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
                  title="Add photos"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload area — replaces canvas when no image loaded */
            <div
              className={`h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                isDragging
                  ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100"
                  : "border-zinc-300 bg-white hover:border-blue-400 hover:shadow-md"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`p-3 rounded-xl mb-3 ${isDragging ? "bg-blue-100" : "bg-zinc-100"}`}>
                <Upload className={`w-7 h-7 ${isDragging ? "text-blue-500" : "text-zinc-400"}`} />
              </div>
              <p className="text-base font-medium text-zinc-700">Drop photos here or click to browse</p>
              <p className="text-sm text-zinc-400 mt-1">PNG, JPG, WebP — select multiple</p>
            </div>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div className={`w-1.5 flex items-center justify-center cursor-col-resize hover:bg-blue-100 transition-colors group ${isResizing ? "bg-blue-200" : ""}`}
        onMouseDown={(e) => { setIsResizing(true); resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }; }}>
        <GripVertical className="w-3 h-3 text-zinc-300 group-hover:text-blue-400" />
      </div>

      {/* Right sidebar — always visible */}
      <div className="border-l border-zinc-200 bg-white flex flex-col min-w-0 overflow-hidden" style={{ width: sidebarWidth }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
          <div className="flex items-center gap-0.5">
            <button onClick={undo} disabled={state.historyIndex <= 0 || !hasImage}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors" title="Undo">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={state.historyIndex >= state.history.length - 1 || !hasImage}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors" title="Redo">
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            <button onClick={handleReset} disabled={!hasImage}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors" title="Reset all">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={handleExport} disabled={!hasImage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-medium rounded-lg transition-colors">
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

        <div className="flex-1 overflow-y-auto min-w-0 flex flex-col">
          {activeTab === "adjust" && (
            <div className="flex flex-col flex-1">
              <Toolbar params={state.currentParams} onUpdateParams={updateParams} disabled={!hasImage} cropMode={cropMode}
                onToggleCrop={() => setCropMode((v) => !v)} />
              <div className="px-4 pb-4">
                <BackgroundRemoval imageSrc={state.originalImage} isRemoved={state.backgroundRemoved}
                  onRemove={handleBackgroundRemove} onRestore={handleBackgroundRestore} />
              </div>
            </div>
          )}
          {activeTab === "watermark" && (
            <div className="p-4 min-w-0 overflow-hidden">
              <WatermarkPanel watermark={watermark} onAdd={handleAddWatermark} disabled={!hasImage}
                onUpdate={handleUpdateWatermark} onRemove={() => setWatermark(null)} />
            </div>
          )}
          {activeTab === "ai" && (
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <AIChat onSubmit={handleAIEdit}
                onAgentEdit={handleAgentEdit}
                isProcessing={state.isProcessing} lastExplanation={lastExplanation}
                lastParams={lastAIParams} previousParams={preAIParams}
                agentSteps={agentSteps} disabled={!hasImage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
