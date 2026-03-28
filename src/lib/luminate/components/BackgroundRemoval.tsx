"use client";

import { Eraser, Loader2, Undo2 } from "lucide-react";
import { useState } from "react";

interface BackgroundRemovalProps {
  imageSrc: string | null;
  isRemoved: boolean;
  onRemove: (resultDataUrl: string) => void;
  onRestore: () => void;
  disabled?: boolean;
}

export function BackgroundRemoval({
  imageSrc,
  isRemoved,
  onRemove,
  onRestore,
  disabled,
}: BackgroundRemovalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const handleRemove = async () => {
    if (!imageSrc || isProcessing) return;
    setIsProcessing(true);
    setProgress("Loading model...");

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      setProgress("Processing image...");

      const result = await removeBackground(blob, {
        progress: (key, current, total) => {
          if (key === "compute:inference") {
            const pct = total > 0 ? Math.round((current / total) * 100) : 0;
            setProgress(`Removing background... ${pct}%`);
          } else if (key === "fetch:model") {
            setProgress("Downloading AI model...");
          }
        },
      });

      setProgress("Finalizing...");

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onRemove(e.target.result as string);
        }
        setIsProcessing(false);
        setProgress("");
      };
      reader.readAsDataURL(result);
    } catch (error) {
      console.error("Background removal failed:", error);
      setIsProcessing(false);
      setProgress("");
    }
  };

  if (isRemoved) {
    return (
      <button
        onClick={onRestore}
        className="flex items-center gap-2 w-full py-2 px-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-sm transition-colors"
      >
        <Undo2 className="w-4 h-4" />
        Restore Background
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleRemove}
        disabled={disabled || !imageSrc || isProcessing}
        className="flex items-center gap-2 w-full py-2 px-3 bg-purple-50 border border-purple-200 hover:bg-purple-100 disabled:bg-zinc-50 disabled:border-zinc-200 text-purple-700 disabled:text-zinc-400 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress || "Processing..."}
          </>
        ) : (
          <>
            <Eraser className="w-4 h-4" />
            Remove Background
          </>
        )}
      </button>
      {isProcessing && (
        <p className="text-[11px] text-zinc-400 px-1">
          This runs entirely in your browser. First use downloads a ~40MB model.
        </p>
      )}
    </div>
  );
}
