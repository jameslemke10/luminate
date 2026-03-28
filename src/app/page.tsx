"use client";

import { LuminateEditor } from "@/lib/luminate";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Luminate
          </h1>
        </div>
        <p className="text-sm text-zinc-400 hidden sm:block">
          AI-powered photo editing, with you in the loop
        </p>
      </header>

      {/* Editor */}
      <main className="flex-1 overflow-hidden">
        <LuminateEditor />
      </main>
    </div>
  );
}
