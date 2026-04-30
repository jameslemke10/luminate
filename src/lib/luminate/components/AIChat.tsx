"use client";

import { Loader2, X, ArrowUp, Bot, Image, Wand2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { EditParams } from "../types";
import { AgentEvent } from "../agent/types";
import { AgentStepIndicator } from "./AgentStepIndicator";

interface AIChatProps {
  onSubmit: (instruction: string) => Promise<void>;
  onAgentEdit?: (instruction: string, logoBase64?: string, logoMimeType?: string) => Promise<void>;
  isProcessing: boolean;
  lastExplanation?: string;
  lastParams?: EditParams | null;
  previousParams?: EditParams | null;
  disabled?: boolean;
  agentSteps?: AgentEvent[];
}

interface Turn {
  id: string;
  userMessage: string;
  steps: AgentEvent[];
  aiResponse?: string;
  params?: EditParams | null;
  prevParams?: EditParams | null;
}

export function AIChat({
  onSubmit,
  onAgentEdit,
  isProcessing,
  lastExplanation,
  lastParams,
  previousParams,
  disabled,
  agentSteps = [],
}: AIChatProps) {
  const [instruction, setInstruction] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [agentMode, setAgentMode] = useState(true);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoMimeType, setLogoMimeType] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || isProcessing;

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

  const handleLogoUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoImage(e.target.result as string);
        setLogoMimeType(file.type);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isDisabled) return;
    const submitted = text.trim();
    setInstruction("");

    setTurns((prev) => [...prev, { id: crypto.randomUUID(), userMessage: submitted, steps: [] }]);

    if (agentMode && onAgentEdit) {
      let logoB64: string | undefined;
      let logoMT: string | undefined;
      if (logoImage) {
        const match = logoImage.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          logoMT = match[1];
          logoB64 = match[2];
        }
      }
      await onAgentEdit(submitted, logoB64, logoMT);
    } else {
      await onSubmit(submitted);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrollable conversation — takes all available space */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {turns.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400">Describe what edits you want</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
            {turns.map((turn, turnIdx) => {
              const isCurrentTurn = turnIdx === turns.length - 1;
              const stepsToShow = isCurrentTurn ? agentSteps : turn.steps;

              return (
                <div key={turn.id} className="flex flex-col gap-2">
                  {/* User message */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-white">U</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800 leading-relaxed">{turn.userMessage}</p>
                    </div>
                  </div>

                  {/* Agent steps */}
                  {stepsToShow.length > 0 && (
                    <div className="ml-8">
                      <AgentStepIndicator steps={stepsToShow} />
                    </div>
                  )}

                  {/* AI response */}
                  {turn.aiResponse && (
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-700 leading-relaxed">{turn.aiResponse}</p>
                      </div>
                    </div>
                  )}

                  {/* Loading for current turn */}
                  {isCurrentTurn && isProcessing && !turn.aiResponse && stepsToShow.length === 0 && (
                    <div className="flex items-center gap-2 ml-8">
                      <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
                      <span className="text-xs text-zinc-400">Working...</span>
                    </div>
                  )}

                  {!isCurrentTurn && <div className="h-px bg-zinc-100 mt-1" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom area — pinned: mode toggle, logo, input */}
      <div className="border-t border-zinc-100 pt-3 flex flex-col gap-2 shrink-0">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAgentMode(false)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !agentMode ? "bg-blue-100 text-blue-700" : "bg-zinc-50 text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Quick Edit
          </button>
          <button
            onClick={() => setAgentMode(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              agentMode ? "bg-purple-100 text-purple-700" : "bg-zinc-50 text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Agent Mode
          </button>
        </div>

        {/* Logo upload */}
        {agentMode && (
          <div className="flex gap-2">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
            {logoImage ? (
              <div className="flex gap-2 w-full items-center">
                <div className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden border border-zinc-200">
                  <img src={logoImage} alt="Logo" className="w-full h-full object-contain bg-white" />
                  <button onClick={() => { setLogoImage(null); setLogoMimeType(null); }}
                    className="absolute top-0 right-0 p-0.5 bg-black/50 hover:bg-black/70 rounded-full">
                    <X className="w-2 h-2 text-white" />
                  </button>
                </div>
                <span className="text-xs text-zinc-500">Logo ready</span>
              </div>
            ) : (
              <button onClick={() => logoInputRef.current?.click()} disabled={isDisabled}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed border-zinc-300 hover:border-purple-400 hover:bg-purple-50/50 rounded-lg text-xs text-zinc-500 hover:text-purple-600 transition-all disabled:cursor-not-allowed">
                <Image className="w-3.5 h-3.5" />
                Upload logo (optional)
              </button>
            )}
          </div>
        )}

        {/* Text input */}
        <div className="flex gap-2 items-end">
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
      </div>
    </div>
  );
}
