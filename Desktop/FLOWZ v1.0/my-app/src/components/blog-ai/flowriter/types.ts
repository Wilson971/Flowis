import { FlowriterStep } from '@/types/blog-ai';

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export interface StepConfig {
  id: FlowriterStep;
  label: string;
  description: string;
}

// Step order: Topic → Config → Outline → Generation → Canvas → Finalize
// Config BEFORE Outline so structure adapts to word count/style!
export const STEPS: StepConfig[] = [
  { id: FlowriterStep.TOPIC, label: 'Sujet', description: 'De quoi parler ?' },
  { id: FlowriterStep.CONFIG, label: 'Style', description: 'Ton & Longueur' },
  { id: FlowriterStep.OUTLINE, label: 'Structure', description: 'Plan adapté' },
  { id: FlowriterStep.GENERATION, label: 'Génération', description: 'Magie IA' },
  { id: FlowriterStep.CANVAS, label: 'Édition', description: 'Peaufiner' },
  { id: FlowriterStep.FINALIZE, label: 'Publication', description: 'Prêt !' },
];

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface FlowriterAssistantProps {
  storeId: string;
  tenantId: string;
  onClose?: () => void;
  onCancel?: () => void;
  onComplete?: (articleId: string) => void;
}

export interface StepIndicatorProps {
  currentStep: FlowriterStep;
  steps: StepConfig[];
}

export interface FooterProps {
  currentStep: FlowriterStep;
  totalSteps: number;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  showResetButton: boolean;
  isSyncing: boolean;
  syncError: string | null | undefined;
  lastSyncTime: Date | null;
  onBack: () => void;
  onNext: () => void;
  onResetOpen: () => void;
}
