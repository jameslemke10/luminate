"use client";

import { Sparkles, Send, Loader2, ImagePlus, X, Wand2, ArrowUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { EditParams } from "../types";

interface AIChatProps {
  onSubmit: (instruction: string) => Promise<void>;
  onMatchTemplate: (referenceDataUrl: string) => Promise<void>;
  isProcessing: boolean;
  lastExplanation?: string;
  lastParams?: EditParams | null;
  previousParams?: EditParams | null;
  disabled?: boolean;
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  params?: EditParams | null;
  prevParams?: EditParams | null;
}

const PARAM_LABELS: Record<string, string> = {
  brightness: "Brightness",
  contrast: "Contrast",
  saturation: "Saturation",
  sharpness: "Sharpness",
  warmth: "Warmth",
  rotation: "Rotation",
};

function ParamDiff({ before, after }: { before: EditParams | null; after: EditParams }) {
  const changes: { label: string; delta: number }[] = [];
  for (const key of Object.keys(PARAM_LABELS)) {
    const k = key as keyof EditParams;
    const from = (before?.[k] as number) ?? 0;
    const to = (after[k] as number) ?? 0;
    if (from !== to) changes.push({ label: PARAM_LABELS[key], delta: to - from });
  }
  if (changes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {changes.map((c) => (
        <span
          key={c.label}
          className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            c.delta > 0
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {c.label} {c.delta > 0 ? "+" : ""}{Math.round(c.delta)}
        </span>
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  "Make it brighter and more vibrant",
  "Professional product photo",
  "Fix the white balance",
  "Sharpen the details",
  "Make it warmer",
  "Increase contrast",
];

export function AIChat({
  onSubmit,
  onMatchTemplate,
  isProcessing,
  lastExplanation,
  lastParams,
  previousParams,
  disabled,
}: AIChatProps) {
  const [instruction, setInstruction] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const refInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || isProcessing;

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
  }, []);

  // When AI responds, add to messages
  const prevExplanationRef = useRef(lastExplanation);
  if (lastExplanation && lastExplanation !== prevExplanationRef.current) {
    prevExplanationRef.current = lastExplanation;
    // Add AI message (using a ref check to avoid re-adding)
    const alreadyAdded = messages.length > 0 && messages[messages.length - 1].role === "ai" && messages[messages.length - 1].text === lastExplanation;
    if (!alreadyAdded) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: lastExplanation!, params: lastParams, prevParams: previousParams },
      ]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isDisabled) return;
    const submitted = text.trim();
    setInstruction("");
    addUserMessage(submitted);
    await onSubmit(submitted);
  };

  const handleAutoEnhance = async () => {
    if (isDisabled) return;
    addUserMessage("Auto-enhance this photo");
    await onSubmit("Analyze this photo and optimize all settings for the best possible result. Make it look professional, well-lit, with accurate colors and sharp details.");
  };

  const handleReferenceUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setReferenceImage(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleMatchStyle = useCallback(async () => {
    if (!referenceImage || isDisabled) return;
    addUserMessage("Match the style of my reference photo");
    await onMatchTemplate(referenceImage);
  }, [referenceImage, isDisabled, onMatchTemplate, addUserMessage]);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Auto-enhance hero button */}
      <button
        onClick={handleAutoEnhance}
        disabled={isDisabled}
        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-zinc-300 disabled:to-zinc-300 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        Auto-Enhance
      </button>

      {/* Match Style - compact */}
      <div className="flex gap-2">
        <input ref={refInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReferenceUpload(f); }} />

        {referenceImage ? (
          <div className="flex gap-2 w-full">
            <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-zinc-200">
              <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
              <button onClick={() => setReferenceImage(null)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 hover:bg-black/70 rounded-full">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
            <button onClick={handleMatchStyle} disabled={isDisabled}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-zinc-300 disabled:to-zinc-300 text-white text-sm font-medium rounded-xl transition-all">
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Match Style
            </button>
          </div>
        ) : (
          <button onClick={() => refInputRef.current?.click()} disabled={isDisabled}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-zinc-300 hover:border-purple-400 hover:bg-purple-50/50 disabled:hover:border-zinc-300 disabled:hover:bg-transparent rounded-xl text-sm text-zinc-500 hover:text-purple-600 disabled:text-zinc-400 transition-all disabled:cursor-not-allowed">
            <ImagePlus className="w-4 h-4" />
            Match a reference style
          </button>
        )}
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(instruction); }
          }}
          placeholder="Describe what you want..."
          disabled={isDisabled}
          rows={1}
          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
        <button
          onClick={() => handleSubmit(instruction)}
          disabled={isDisabled || !instruction.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 rounded-xl transition-colors shrink-0"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handleSubmit(s)} disabled={isDisabled}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <>
          <div className="h-px bg-zinc-100" />
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-zinc-100 text-zinc-700 rounded-bl-sm"
                  }`}
                >
                  <p className="text-[13px] leading-relaxed">{msg.text}</p>
                  {msg.role === "ai" && msg.params && (
                    <ParamDiff before={msg.prevParams ?? null} after={msg.params} />
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </>
      )}
    </div>
  );
}
