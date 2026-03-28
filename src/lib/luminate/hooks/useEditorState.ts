"use client";

import { useCallback, useState } from "react";
import { DEFAULT_EDIT_PARAMS, EditParams, EditorState } from "../types";

const MAX_HISTORY = 50;

export function useEditorState() {
  const [state, setState] = useState<EditorState>({
    originalImage: null,
    currentParams: { ...DEFAULT_EDIT_PARAMS },
    history: [{ ...DEFAULT_EDIT_PARAMS }],
    historyIndex: 0,
    isProcessing: false,
    backgroundRemoved: false,
  });

  const setImage = useCallback((dataUrl: string) => {
    setState({
      originalImage: dataUrl,
      currentParams: { ...DEFAULT_EDIT_PARAMS },
      history: [{ ...DEFAULT_EDIT_PARAMS }],
      historyIndex: 0,
      isProcessing: false,
      backgroundRemoved: false,
    });
  }, []);

  const updateParams = useCallback((newParams: Partial<EditParams>) => {
    setState((prev) => {
      const merged = { ...prev.currentParams, ...newParams };
      // Truncate future history if we're not at the end
      const newHistory = [
        ...prev.history.slice(0, prev.historyIndex + 1),
        merged,
      ].slice(-MAX_HISTORY);

      return {
        ...prev,
        currentParams: merged,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const setParams = useCallback((params: EditParams) => {
    setState((prev) => {
      const newHistory = [
        ...prev.history.slice(0, prev.historyIndex + 1),
        params,
      ].slice(-MAX_HISTORY);

      return {
        ...prev,
        currentParams: params,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        currentParams: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        currentParams: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentParams: { ...DEFAULT_EDIT_PARAMS },
      history: [...prev.history, { ...DEFAULT_EDIT_PARAMS }],
      historyIndex: prev.history.length,
      backgroundRemoved: false,
    }));
  }, []);

  const clearImage = useCallback(() => {
    setState({
      originalImage: null,
      currentParams: { ...DEFAULT_EDIT_PARAMS },
      history: [{ ...DEFAULT_EDIT_PARAMS }],
      historyIndex: 0,
      isProcessing: false,
      backgroundRemoved: false,
    });
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing }));
  }, []);

  const setBackgroundRemoved = useCallback((backgroundRemoved: boolean) => {
    setState((prev) => ({ ...prev, backgroundRemoved }));
  }, []);

  return {
    state,
    setImage,
    clearImage,
    updateParams,
    setParams,
    undo,
    redo,
    reset,
    setProcessing,
    setBackgroundRemoved,
  };
}
