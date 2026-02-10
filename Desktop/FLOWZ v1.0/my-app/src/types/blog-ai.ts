/**
 * Blog AI Types (Flowriter)
 *
 * Types for the AI-powered article generation workflow
 */

import { ToneType, StyleType, PersonaType, ArticleConfig } from './blog';

// ============================================================================
// WIZARD STEPS
// ============================================================================

export enum FlowriterStep {
  TOPIC = 1,      // Define WHAT to write about
  CONFIG = 2,     // Define HOW to write (style, tone, length) - BEFORE outline!
  OUTLINE = 3,    // Generate structure BASED ON config (word count affects sections)
  GENERATION = 4, // AI generates content
  CANVAS = 5,     // Edit and polish
  FINALIZE = 6,   // Publish/export
}

export type StepId = 'topic' | 'outline' | 'config' | 'generation' | 'canvas' | 'finalize';

// ============================================================================
// OUTLINE TYPES
// ============================================================================

export enum HeadingLevel {
  H1 = 1,
  H2 = 2,
  H3 = 3,
}

export type BlockType = 'heading' | 'image' | 'table' | 'quote' | 'faq' | 'code' | 'paragraph';

export interface OutlineItem {
  id: string;
  type: BlockType;
  title: string;
  level?: HeadingLevel;
  seoScore?: number;
  content?: string;
  children?: OutlineItem[];
}

// ============================================================================
// TITLE SUGGESTIONS
// ============================================================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type VolumeLevel = 'low' | 'medium' | 'high';

export interface TitleSuggestion {
  id: string;
  title: string;
  keywords: string[];
  seoScore: number;
  difficulty: DifficultyLevel;
  searchVolume: VolumeLevel;
  selected?: boolean;
}

// ============================================================================
// ARTICLE DATA (Complete State)
// ============================================================================

export interface ArticleData {
  topic: string;
  title: string;
  titleSuggestions: TitleSuggestion[];
  selectedKeywords: string[];
  outline: OutlineItem[];
  config: ArticleConfig;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  sources?: SourceReference[];
}

export interface SourceReference {
  title: string;
  url: string;
  snippet?: string;
}

// ============================================================================
// GENERATION PROGRESS
// ============================================================================

export type GenerationPhase =
  | 'idle'
  | 'analyzing'
  | 'researching'
  | 'writing'
  | 'optimizing'
  | 'complete'
  | 'error';

export interface GenerationProgress {
  phase: GenerationPhase;
  currentSection: number;
  totalSections: number;
  currentSectionTitle: string;
  streamedContent: string;
  elapsedTime: number;
  error?: string;
}

// ============================================================================
// CANVAS AI ACTIONS
// ============================================================================

export type CanvasAIAction =
  | 'rewrite'
  | 'improve'
  | 'expand'
  | 'shorten'
  | 'translate'
  | 'continue'
  | 'factcheck'
  | 'simplify'
  | 'formalize'
  | 'change_tone'
  | 'correct';

export interface CanvasActionResult {
  action: CanvasAIAction;
  originalText: string;
  resultText: string;
  timestamp: number;
}

// ============================================================================
// SEO ANALYSIS
// ============================================================================

export interface SeoKeyword {
  keyword: string;
  count: number;
  density: number;
  inTitle: boolean;
  inHeadings: boolean;
  inMeta: boolean;
}

export interface SeoSuggestion {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  field?: string;
}

export interface SeoAnalysisResult {
  overallScore: number;
  keywordDensity: number;
  readabilityScore: number;
  structureScore: number;
  keywords: SeoKeyword[];
  suggestions: { type: 'success' | 'warning' | 'error'; text: string }[];
  linkingSuggestions: {
    internal: string[];
    external: string[];
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export interface FlowriterState {
  currentStep: FlowriterStep;
  articleData: ArticleData;
  generationProgress: GenerationProgress;
  seoAnalysis: SeoAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  canProceed: boolean;
  history: ArticleData[];
}

// Action types for reducer
export type FlowriterAction =
  | { type: 'SET_STEP'; step: FlowriterStep }
  | { type: 'SET_TOPIC'; topic: string }
  | { type: 'SET_TITLE_SUGGESTIONS'; suggestions: TitleSuggestion[] }
  | { type: 'SELECT_TITLE'; title: string }
  | { type: 'TOGGLE_KEYWORD'; keyword: string }
  | { type: 'SET_OUTLINE'; outline: OutlineItem[] }
  | { type: 'ADD_OUTLINE_ITEM'; item: OutlineItem; afterId?: string }
  | { type: 'REMOVE_OUTLINE_ITEM'; id: string }
  | { type: 'REORDER_OUTLINE'; items: OutlineItem[] }
  | { type: 'UPDATE_CONFIG'; config: Partial<ArticleConfig> }
  | { type: 'START_GENERATION' }
  | { type: 'UPDATE_GENERATION_PROGRESS'; progress: Partial<GenerationProgress> }
  | { type: 'APPEND_CONTENT'; content: string }
  | { type: 'SET_CONTENT'; content: string }
  | { type: 'GENERATION_COMPLETE'; content: string; meta?: { title?: string; description?: string } }
  | { type: 'GENERATION_ERROR'; error: string }
  | { type: 'SET_META'; metaTitle?: string; metaDescription?: string }
  | { type: 'SET_SOURCES'; sources: SourceReference[] }
  | { type: 'SET_SEO_ANALYSIS'; analysis: SeoAnalysisResult | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }
  | { type: 'RESTORE_FROM_HISTORY'; index: number }
  | { type: 'HYDRATE_STATE'; state: FlowriterState };

// ============================================================================
// API TYPES
// ============================================================================

export interface GenerateTitlesRequest {
  topic: string;
  language?: string;
  count?: number;
}

export interface GenerateOutlineRequest {
  topic: string;
  title: string;
  keywords?: string[];
  language?: string;
  // Config parameters for intelligent outline generation
  config?: {
    targetWordCount?: number;
    tone?: string;
    style?: string;
    persona?: string;
    includeTableOfContents?: boolean;
    includeFAQ?: boolean;
  };
}

export interface GenerateArticleRequest {
  topic: string;
  title: string;
  outline: OutlineItem[];
  config: ArticleConfig;
}

export interface GenerateMetaRequest {
  title: string;
  content: string;
  keywords?: string[];
}

export interface RewriteTextRequest {
  text: string;
  action: CanvasAIAction;
  context?: string;
  language?: string;
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export type ExportFormat = 'markdown' | 'html' | 'json' | 'docx' | 'wordpress';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeSources: boolean;
  includeImages: boolean;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_ARTICLE_CONFIG: ArticleConfig = {
  tone: 'Expert',
  style: 'Blog Lifestyle',
  targetWordCount: 1500,
  persona: 'intermediate',
  targetKeywords: [],
  sources: [],
  language: 'fr',
  includeTableOfContents: true,
  includeFAQ: false,
};

export const DEFAULT_GENERATION_PROGRESS: GenerationProgress = {
  phase: 'idle',
  currentSection: 0,
  totalSections: 0,
  currentSectionTitle: '',
  streamedContent: '',
  elapsedTime: 0,
};

export const DEFAULT_ARTICLE_DATA: ArticleData = {
  topic: '',
  title: '',
  titleSuggestions: [],
  selectedKeywords: [],
  outline: [],
  config: DEFAULT_ARTICLE_CONFIG,
  content: '',
  sources: [],
};

export const DEFAULT_FLOWRITER_STATE: FlowriterState = {
  currentStep: FlowriterStep.TOPIC,
  articleData: DEFAULT_ARTICLE_DATA,
  generationProgress: DEFAULT_GENERATION_PROGRESS,
  seoAnalysis: null,
  isLoading: false,
  error: null,
  canProceed: false,
  history: [],
};

// ============================================================================
// CANVAS ACTION PROMPTS
// ============================================================================

export const CANVAS_ACTION_LABELS: Record<CanvasAIAction, { label: string; description: string }> = {
  rewrite: {
    label: 'Réécrire',
    description: 'Reformule le texte différemment en gardant le sens',
  },
  improve: {
    label: 'Améliorer',
    description: 'Améliore la fluidité et le style',
  },
  expand: {
    label: 'Développer',
    description: 'Ajoute plus de détails et d\'exemples',
  },
  shorten: {
    label: 'Raccourcir',
    description: 'Résume en conservant l\'essentiel',
  },
  translate: {
    label: 'Traduire',
    description: 'Traduit en anglais',
  },
  continue: {
    label: 'Continuer',
    description: 'Continue le texte naturellement',
  },
  factcheck: {
    label: 'Vérifier',
    description: 'Vérifie les faits mentionnés',
  },
  simplify: {
    label: 'Simplifier',
    description: 'Rend le texte plus accessible',
  },
  formalize: {
    label: 'Formaliser',
    description: 'Rend le texte plus professionnel',
  },
  change_tone: {
    label: 'Changer de ton',
    description: 'Adapte le ton du texte',
  },
  correct: {
    label: 'Correction',
    description: 'Corrige la grammaire et l\'orthographe',
  },
};

// ============================================================================
// TONE & STYLE OPTIONS
// ============================================================================

export const TONE_OPTIONS: { value: ToneType; label: string; description: string }[] = [
  { value: 'Expert', label: 'Expert', description: 'Ton professionnel et autoritaire' },
  { value: 'Narratif', label: 'Narratif', description: 'Style storytelling engageant' },
  { value: 'Minimaliste', label: 'Minimaliste', description: 'Direct et concis' },
  { value: 'Inspirant', label: 'Inspirant', description: 'Motivant et positif' },
  { value: 'Conversationnel', label: 'Conversationnel', description: 'Amical et accessible' },
];

export const STYLE_OPTIONS: { value: StyleType; label: string; description: string }[] = [
  { value: 'Journalistique', label: 'Journalistique', description: 'Factuel et informatif' },
  { value: 'Académique', label: 'Académique', description: 'Rigoureux et sourcé' },
  { value: 'Blog Lifestyle', label: 'Blog Lifestyle', description: 'Personnel et engageant' },
  { value: 'Storytelling', label: 'Storytelling', description: 'Narratif et immersif' },
  { value: 'Tutorial', label: 'Tutorial', description: 'Pratique et didactique' },
];

export const PERSONA_OPTIONS: { value: PersonaType; label: string; description: string }[] = [
  { value: 'beginner', label: 'Débutant', description: 'Explications simples et claires' },
  { value: 'intermediate', label: 'Intermédiaire', description: 'Niveau standard' },
  { value: 'expert', label: 'Expert', description: 'Contenu technique avancé' },
];
