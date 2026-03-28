"use client";

import {
  Upload,
  Sparkles,
  SlidersHorizontal,
  Eraser,
  Stamp,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { ImageSession } from "./LuminateEditor";

interface HomeScreenProps {
  onImageLoad: (dataUrl: string) => void;
  sessions?: ImageSession[];
  onRestoreSession?: (session: ImageSession) => void;
}

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI-Powered Editing",
    description: "Describe what you want or upload a reference photo. AI analyzes and adjusts -- no hallucinated pixels.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: <ImageIcon className="w-5 h-5" />,
    title: "Match Style",
    description: "Upload a gold-standard photo and instantly match its lighting, color grading, and mood.",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    icon: <SlidersHorizontal className="w-5 h-5" />,
    title: "Manual Controls",
    description: "Fine-tune brightness, contrast, saturation, warmth, sharpness, rotation, and crop.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: <Eraser className="w-5 h-5" />,
    title: "Background Removal",
    description: "Remove backgrounds entirely in your browser. No uploads, no API keys, free.",
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    icon: <Stamp className="w-5 h-5" />,
    title: "Watermark & Logo",
    description: "Add text or logo watermarks. Drag to position, adjust opacity and size live.",
    color: "bg-pink-50 text-pink-600 border-pink-100",
  },
];

export function HomeScreen({ onImageLoad, sessions = [], onRestoreSession }: HomeScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) onImageLoad(e.target.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center h-full overflow-y-auto bg-zinc-50">
      <div className="w-full max-w-2xl px-6 py-10 flex flex-col items-center gap-8">
        {/* Upload area */}
        <div
          className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100"
              : "border-zinc-300 bg-white hover:border-blue-400 hover:shadow-md"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="flex flex-col items-center gap-3 py-12 px-6">
            <div className={`p-3 rounded-xl ${isDragging ? "bg-blue-100" : "bg-zinc-100"}`}>
              <Upload className={`w-7 h-7 ${isDragging ? "text-blue-500" : "text-zinc-400"}`} />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-zinc-700">Drop your photo here or click to browse</p>
              <p className="text-sm text-zinc-400 mt-1">PNG, JPG, WebP</p>
            </div>
          </div>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-500">Recent</h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {sessions.slice().reverse().map((session) => (
                <button
                  key={session.id}
                  onClick={() => onRestoreSession?.(session)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:border-blue-400 hover:shadow-md transition-all bg-white"
                >
                  <img src={session.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="w-full">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 text-center">
            What you can do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3 p-4 rounded-xl bg-white border border-zinc-100 hover:shadow-sm transition-shadow">
                <div className={`p-2 rounded-lg border shrink-0 h-fit ${f.color}`}>{f.icon}</div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{f.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
