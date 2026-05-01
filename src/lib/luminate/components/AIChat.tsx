"use client";

import { Loader2, X, ArrowUp, Bot, Plus, Wand2, ChevronDown, Paperclip, ImagePlus, Sparkles, SunMedium, Layers, Square } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { EditParams } from "../types";
import { AgentEvent } from "../agent/types";
import { AgentStepIndicator } from "./AgentStepIndicator";

export const GEMINI_MODELS = [
  { id: "gemini-2.5-pro", label: "2.5 Pro" },
  { id: "gemini-2.5-flash", label: "2.5 Flash" },
  { id: "gemini-3.1-pro-preview", label: "3.1 Pro" },
];

interface AIChatProps {
  onSubmit: (instruction: string, model: string) => Promise<void>;
  onAgentEdit?: (instruction: string, model: string, logoBase64?: string, logoMimeType?: string) => Promise<void>;
  onStop?: () => void;
  isProcessing: boolean;
  lastExplanation?: string;
  lastParams?: EditParams | null;
  previousParams?: EditParams | null;
  hasImage?: boolean;
  agentSteps?: AgentEvent[];
}

interface Turn {
  id: string;
  userMessage: string;
  steps: AgentEvent[];
  aiResponse?: string;
  params?: EditParams | null;
  prevParams?: EditParams | null;
  attachedRef?: boolean;
}

export function AIChat({
  onSubmit,
  onAgentEdit,
  onStop,
  isProcessing,
  lastExplanation,
  lastParams,
  previousParams,
  hasImage = false,
  agentSteps = [],
}: AIChatProps) {
  const [instruction, setInstruction] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [agentMode, setAgentMode] = useState(true);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [refMimeType, setRefMimeType] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [noImageNudge, setNoImageNudge] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const isDisabled = isProcessing;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 120;
    if (el.scrollHeight > maxH) {
      el.style.height = maxH + "px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = el.scrollHeight + "px";
      el.style.overflowY = "hidden";
    }
  }, [instruction]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keep the current turn's steps in sync with the live agentSteps prop
  useEffect(() => {
    if (agentSteps.length === 0) return;
    setTurns((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], steps: agentSteps };
      return updated;
    });
  }, [agentSteps]);

  // When AI responds, attach it to the latest turn
  const prevExplanationRef = useRef(lastExplanation);
  useEffect(() => {
    if (lastExplanation && lastExplanation !== prevExplanationRef.current) {
      prevExplanationRef.current = lastExplanation;
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.aiResponse === lastExplanation) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          aiResponse: lastExplanation,
          params: lastParams,
          prevParams: previousParams,
        };
        return updated;
      });
    }
  }, [lastExplanation, lastParams, previousParams]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, agentSteps]);

  const handleRefUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setRefImage(e.target.result as string);
        setRefMimeType(file.type);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (hasImage) setNoImageNudge(false);
  }, [hasImage]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isDisabled) return;
    if (!hasImage) {
      setNoImageNudge(true);
      return;
    }
    setNoImageNudge(false);
    const submitted = text.trim();
    setInstruction("");

    setTurns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), userMessage: submitted, steps: [], attachedRef: !!refImage },
    ]);

    if (agentMode && onAgentEdit) {
      let refB64: string | undefined;
      let refMT: string | undefined;
      if (refImage) {
        const match = refImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          refMT = match[1];
          refB64 = match[2];
        }
      }
      await onAgentEdit(submitted, selectedModel, refB64, refMT);
    } else {
      await onSubmit(submitted, selectedModel);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrollable conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 select-none">
            {/* Decorative icon cluster */}
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-3 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md rotate-12">
                <SunMedium className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-3 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md -rotate-12">
                <Layers className="w-4 h-4 text-white" />
              </div>
            </div>

            <h3 className="text-base font-semibold text-zinc-800 mb-1">AI Photo Editor</h3>
            <p className="text-sm text-zinc-400 text-center">
              {hasImage ? "Tell me what to change" : "Load a photo, then chat"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            {turns.map((turn, turnIdx) => {
              const isCurrentTurn = turnIdx === turns.length - 1;
              const stepsToShow = isCurrentTurn ? agentSteps : turn.steps;

              return (
                <div key={turn.id} className="flex flex-col gap-1.5">
                  {/* User message */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-3.5 py-2.5">
                    <p className="text-sm text-zinc-800">{turn.userMessage}</p>
                    {turn.attachedRef && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-500">
                        <Paperclip className="w-2.5 h-2.5" /> file attached
                      </span>
                    )}
                  </div>

                  {/* Agent timeline — tool calls, thinking, and AI response */}
                  {(stepsToShow.length > 0 || turn.aiResponse) && (
                    <div className="ml-2">
                      <AgentStepIndicator steps={stepsToShow} aiResponse={turn.aiResponse} />
                    </div>
                  )}

                  {/* Loading spinner when no steps yet */}
                  {isCurrentTurn && isProcessing && !turn.aiResponse && stepsToShow.length === 0 && (
                    <div className="flex items-center gap-2 ml-2">
                      <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                      <span className="text-xs text-zinc-400">Working...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input area — Claude Code style */}
      <div className="border-t border-zinc-100 pt-3 shrink-0">
        <input ref={refInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRefUpload(f); }} />

        {/* No-image nudge */}
        {noImageNudge && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <ImagePlus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-700">Drop or upload a photo on the canvas first, then I can edit it for you</span>
          </div>
        )}

        {/* Reference image chip */}
        {refImage && (
          <div className="flex items-center gap-1.5 mb-2 ml-0.5">
            <div className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 bg-zinc-100 rounded-md border border-zinc-200">
              <div className="w-5 h-5 rounded overflow-hidden shrink-0">
                <img src={refImage} alt="Attachment" className="w-full h-full object-contain bg-white" />
              </div>
              <span className="text-[11px] text-zinc-600">File</span>
              <button
                onClick={() => { setRefImage(null); setRefMimeType(null); }}
                className="ml-0.5 p-0.5 rounded hover:bg-zinc-200 transition-colors"
              >
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="relative border border-zinc-200 rounded-xl bg-zinc-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
          <textarea
            ref={textareaRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(instruction); }
            }}
            placeholder={turns.length > 0 ? "Ask for more edits..." : "Describe what you want..."}
            disabled={isDisabled}
            rows={1}
            className="w-full bg-transparent px-3 pt-2.5 pb-9 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />

          {/* Toolbar row inside the input box */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-1.5">
            {/* Left: plus button + mode toggle */}
            <div className="flex items-center gap-1">
              {/* Plus / attach button */}
              <button
                onClick={() => refInputRef.current?.click()}
                disabled={isDisabled}
                title="Attach file"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Mode selector */}
              <div className="relative" ref={modeMenuRef}>
                <button
                  onClick={() => { setShowModeMenu(!showModeMenu); setShowModelMenu(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
                >
                  {agentMode ? (
                    <>
                      <Bot className="w-3.5 h-3.5 text-purple-500" />
                      <span>Agent</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Quick</span>
                    </>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showModeMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={() => { setAgentMode(true); setShowModeMenu(false); }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${
                        agentMode ? "bg-purple-50 text-purple-700" : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-medium">Agent Mode</div>
                        <div className="text-[10px] text-zinc-400">Multi-step reasoning</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setAgentMode(false); setShowModeMenu(false); }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${
                        !agentMode ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <div>
                        <div className="font-medium">Quick Edit</div>
                        <div className="text-[10px] text-zinc-400">Single-shot edit</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-zinc-200" />

              {/* Model selector */}
              <div className="relative" ref={modelMenuRef}>
                <button
                  onClick={() => { setShowModelMenu(!showModelMenu); setShowModeMenu(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
                >
                  <span>{GEMINI_MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showModelMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-10">
                    {GEMINI_MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${
                          selectedModel === m.id ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        <div>
                          <div className="font-medium">{m.label}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{m.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: send or stop button */}
            {isProcessing ? (
              <button
                onClick={onStop}
                className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors shrink-0"
              >
                <Square className="w-3.5 h-3.5 text-white fill-white" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(instruction)}
                disabled={!instruction.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 rounded-lg transition-colors shrink-0"
              >
                <ArrowUp className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
