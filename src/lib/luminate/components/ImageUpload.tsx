"use client";

import { Upload, Image as ImageIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  onImageLoad: (dataUrl: string) => void;
}

export function ImageUpload({ onImageLoad }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageLoad(e.target.result as string);
        }
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
    <div
      className={`
        flex flex-col items-center justify-center w-full h-full
        border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
        ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-zinc-300 hover:border-zinc-400 bg-white"
        }
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="flex flex-col items-center gap-3 text-zinc-400">
        <div className={`p-4 rounded-full ${isDragging ? "bg-blue-100" : "bg-zinc-100"}`}>
          {isDragging ? (
            <ImageIcon className="w-8 h-8 text-blue-500" />
          ) : (
            <Upload className="w-8 h-8 text-zinc-400" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-600">
            Drop your photo here or click to browse
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            PNG, JPG, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
