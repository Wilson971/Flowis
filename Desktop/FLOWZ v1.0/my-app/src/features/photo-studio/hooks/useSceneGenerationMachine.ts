/**
 * useSceneGenerationMachine Hook
 *
 * Pure React state machine for tracking scene generation progress.
 * Provides granular feedback states (idle -> optimistic -> processing -> success/error)
 * with sub-steps (analyzing, generating, uploading, finishing) for rich UI feedback.
 *
 * No external dependencies -- uses only useState and useCallback.
 */

import { useState, useCallback } from 'react';
import type {
  SceneGenerationState,
  ProcessingStep,
  ProcessFeedback,
} from '../types/studio';

// ============================================================================
// HOOK
// ============================================================================

export function useSceneGenerationMachine() {
  const [feedback, setFeedback] = useState<ProcessFeedback>({
    currentState: 'idle',
  });

  // --------------------------------------------------------------------------
  // Transition: idle -> optimistic
  // Called immediately when the user triggers generation to show a placeholder.
  // --------------------------------------------------------------------------
  const startOptimistic = useCallback((placeholderId: string) => {
    setFeedback({
      currentState: 'optimistic',
      placeholderId,
      progress: 0,
    });
  }, []);

  // --------------------------------------------------------------------------
  // Transition: optimistic -> processing
  // Called when the actual API request begins.
  // --------------------------------------------------------------------------
  const startProcessing = useCallback(() => {
    setFeedback((prev) => ({
      ...prev,
      currentState: 'processing',
      currentStep: 'analyzing',
      progress: 10,
    }));
  }, []);

  // --------------------------------------------------------------------------
  // Update the current processing step and optional progress.
  // --------------------------------------------------------------------------
  const setStep = useCallback(
    (step: ProcessingStep, progress?: number) => {
      setFeedback((prev) => ({
        ...prev,
        currentStep: step,
        progress: progress ?? prev.progress,
      }));
    },
    []
  );

  // --------------------------------------------------------------------------
  // Transition: processing -> success
  // --------------------------------------------------------------------------
  const finishSuccess = useCallback(() => {
    setFeedback({
      currentState: 'success',
      progress: 100,
    });
  }, []);

  // --------------------------------------------------------------------------
  // Transition: any -> error
  // --------------------------------------------------------------------------
  const fail = useCallback((error: string) => {
    setFeedback({
      currentState: 'error',
      error,
    });
  }, []);

  // --------------------------------------------------------------------------
  // Transition: any -> idle
  // --------------------------------------------------------------------------
  const reset = useCallback(() => {
    setFeedback({ currentState: 'idle' });
  }, []);

  // --------------------------------------------------------------------------
  // Derived boolean flags for convenient conditional rendering.
  // --------------------------------------------------------------------------
  return {
    feedback,
    startOptimistic,
    startProcessing,
    setStep,
    finishSuccess,
    fail,
    reset,
    isIdle: feedback.currentState === 'idle',
    isLoading:
      feedback.currentState === 'optimistic' ||
      feedback.currentState === 'processing',
    isSuccess: feedback.currentState === 'success',
    isError: feedback.currentState === 'error',
  };
}
