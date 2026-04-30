"use client";

import { Type, ImagePlus, X, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { WatermarkOverlay } from "../types";

interface WatermarkPanelProps {
  watermark: WatermarkOverlay | null;
  onAdd: (type: "text" | "image", content: string) => void;
  onUpdate: (updates: Partial<WatermarkOverlay["config"]>) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function WatermarkPanel({
  watermark,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: WatermarkPanelProps) {
  const [mode, setMode] = useState<"text" | "image">("image");
  const [text, setText] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync logo preview from watermark state
  useEffect(() => {
    if (watermark?.config.imageUrl) {
      setLogoPreview(watermark.config.imageUrl);
    }
  }, [watermark?.config.imageUrl]);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (mode === "text" && text.trim()) {
      onAdd("text", text.trim());
    } else if (mode === "image" && logoPreview) {
      onAdd("image", logoPreview);
    }
  };

  const isActive = !!watermark;

  return (
    <div className={`flex flex-col gap-4 min-w-0 overflow-hidden ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* If watermark is active, show live controls */}
      {isActive ? (
        <>
          {/* Preview of what's on canvas */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Active Watermark
            </p>
            <button
              onClick={onRemove}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>

          {/* Logo preview */}
          {watermark.config.imageUrl && (
            <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
              <img
                src={watermark.config.imageUrl}
                alt="Logo"
                className="w-10 h-10 object-contain rounded bg-white border border-zinc-100"
              />
              <p className="text-xs text-zinc-500">Logo watermark</p>
            </div>
          )}
          {watermark.config.text && (
            <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="w-10 h-10 flex items-center justify-center rounded bg-white border border-zinc-100">
                <Type className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-xs text-zinc-500 truncate">&ldquo;{watermark.config.text}&rdquo;</p>
            </div>
          )}

          {/* Live opacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-medium">Opacity</span>
              <span className="text-zinc-400 font-mono tabular-nums">
                {Math.round(watermark.config.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              value={watermark.config.opacity * 100}
              onChange={(e) =>
                onUpdate({ opacity: Number(e.target.value) / 100 })
              }
              className="w-full cursor-pointer"
            />
          </div>

          {/* Live size */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-medium">Size</span>
              <span className="text-zinc-400 font-mono tabular-nums">
                {Math.round(watermark.config.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={80}
              value={watermark.config.scale * 100}
              onChange={(e) =>
                onUpdate({ scale: Number(e.target.value) / 100 })
              }
              className="w-full cursor-pointer"
            />
          </div>

          <p className="text-[11px] text-zinc-400 break-words">
            Drag on canvas to reposition. Press Delete to remove.
          </p>
        </>
      ) : (
        <>
          {/* Mode toggle */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Type
            </p>
            <div className="flex gap-1 bg-zinc-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode("image")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  mode === "image"
                    ? "bg-white text-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <ImagePlus className="w-3.5 h-3.5" /> Logo
              </button>
              <button
                onClick={() => setMode("text")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                  mode === "text"
                    ? "bg-white text-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Text
              </button>
            </div>
          </div>

          {/* Content */}
          {mode === "text" ? (
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Watermark text..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              {logoPreview ? (
                <div className="relative">
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors"
                    onClick={() => fileRef.current?.click()}>
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-12 h-12 object-contain rounded bg-white border border-zinc-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-600 font-medium">Logo ready</p>
                      <p className="text-xs text-zinc-400">Click to change</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLogoPreview(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-zinc-200 hover:bg-zinc-300 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-6 px-3 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg text-sm text-zinc-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
                >
                  <ImagePlus className="w-5 h-5 mx-auto mb-1" />
                  Upload logo
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={
              (mode === "text" && !text.trim()) ||
              (mode === "image" && !logoPreview)
            }
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 text-white disabled:text-zinc-400 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            Add to Image
          </button>
        </>
      )}
    </div>
  );
}
