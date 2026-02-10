"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type SessionImage = {
  id: string;
  url: string;
  type: 'source' | 'generated';
  status: 'loading' | 'active' | 'published';
  createdAt: number;
  sessionId?: string;
};

type Tag = {
  key: string;
  value: string;
  locked: boolean;
};

interface StudioState {
  currentProductId: string | null;
  selectedImageId: string | null;
  selectedImageType: 'source' | 'generated' | null;
  isGenerating: boolean;
  generatingSessionId: string | null;
  sessionImages: SessionImage[];
  detectedTags: Tag[];
  selectedPresetId: string | null;
  selectedBrandStyleId: string | null;
  customPrompt: string;
  isStudioOpen: boolean;
  studioProductId: string | null;
}

// ============================================================================
// ACTIONS
// ============================================================================

type StudioAction =
  | { type: 'SET_PRODUCT'; productId: string }
  | { type: 'SELECT_IMAGE'; id: string | null; imageType: 'source' | 'generated' | null }
  | { type: 'START_GENERATION'; sessionId: string | null }
  | { type: 'STOP_GENERATION' }
  | { type: 'SET_SESSION_IMAGES'; images: SessionImage[] }
  | { type: 'ADD_SESSION_IMAGE'; image: SessionImage }
  | { type: 'UPDATE_SESSION_IMAGE'; id: string; updates: Partial<SessionImage> }
  | { type: 'SET_DETECTED_TAGS'; tags: Tag[] }
  | { type: 'TOGGLE_TAG_LOCK'; key: string }
  | { type: 'REMOVE_TAG'; key: string }
  | { type: 'SET_PRESET'; presetId: string | null }
  | { type: 'SET_BRAND_STYLE'; brandStyleId: string | null }
  | { type: 'SET_CUSTOM_PROMPT'; prompt: string }
  | { type: 'OPEN_STUDIO'; productId: string }
  | { type: 'CLOSE_STUDIO' }
  | { type: 'RESET' };

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: StudioState = {
  currentProductId: null,
  selectedImageId: null,
  selectedImageType: null,
  isGenerating: false,
  generatingSessionId: null,
  sessionImages: [],
  detectedTags: [],
  selectedPresetId: null,
  selectedBrandStyleId: null,
  customPrompt: '',
  isStudioOpen: false,
  studioProductId: null,
};

// ============================================================================
// REDUCER
// ============================================================================

function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'SET_PRODUCT': {
      if (state.currentProductId === action.productId) {
        return state;
      }
      return {
        ...state,
        currentProductId: action.productId,
        selectedImageId: null,
        selectedImageType: null,
        sessionImages: [],
        isGenerating: false,
        generatingSessionId: null,
      };
    }

    case 'SELECT_IMAGE': {
      return {
        ...state,
        selectedImageId: action.id,
        selectedImageType: action.imageType,
      };
    }

    case 'START_GENERATION': {
      return {
        ...state,
        isGenerating: true,
        generatingSessionId: action.sessionId,
      };
    }

    case 'STOP_GENERATION': {
      return {
        ...state,
        isGenerating: false,
        generatingSessionId: null,
      };
    }

    case 'SET_SESSION_IMAGES': {
      return {
        ...state,
        sessionImages: action.images,
      };
    }

    case 'ADD_SESSION_IMAGE': {
      return {
        ...state,
        sessionImages: [...state.sessionImages, action.image],
      };
    }

    case 'UPDATE_SESSION_IMAGE': {
      return {
        ...state,
        sessionImages: state.sessionImages.map((img) =>
          img.id === action.id ? { ...img, ...action.updates } : img
        ),
      };
    }

    case 'SET_DETECTED_TAGS': {
      return {
        ...state,
        detectedTags: action.tags,
      };
    }

    case 'TOGGLE_TAG_LOCK': {
      return {
        ...state,
        detectedTags: state.detectedTags.map((tag) =>
          tag.key === action.key ? { ...tag, locked: !tag.locked } : tag
        ),
      };
    }

    case 'REMOVE_TAG': {
      return {
        ...state,
        detectedTags: state.detectedTags.filter((tag) => tag.key !== action.key),
      };
    }

    case 'SET_PRESET': {
      return {
        ...state,
        selectedPresetId: action.presetId,
      };
    }

    case 'SET_BRAND_STYLE': {
      return {
        ...state,
        selectedBrandStyleId: action.brandStyleId,
      };
    }

    case 'SET_CUSTOM_PROMPT': {
      return {
        ...state,
        customPrompt: action.prompt,
      };
    }

    case 'OPEN_STUDIO': {
      const isNewProduct = state.studioProductId !== action.productId;
      if (isNewProduct) {
        return {
          ...state,
          isStudioOpen: true,
          studioProductId: action.productId,
          currentProductId: action.productId,
          selectedImageId: null,
          selectedImageType: null,
          sessionImages: [],
          isGenerating: false,
          generatingSessionId: null,
          detectedTags: [],
        };
      }
      return {
        ...state,
        isStudioOpen: true,
      };
    }

    case 'CLOSE_STUDIO': {
      return {
        ...state,
        isStudioOpen: false,
        selectedImageId: null,
        selectedImageType: null,
      };
    }

    case 'RESET': {
      return initialState;
    }

    default: {
      return state;
    }
  }
}

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
  // Convenience actions
  setCurrentProduct: (productId: string) => void;
  setSelectedImage: (id: string | null, type: 'source' | 'generated' | null) => void;
  setIsGenerating: (isGenerating: boolean, sessionId?: string | null) => void;
  setSessionImages: (images: SessionImage[]) => void;
  addSessionImage: (image: SessionImage) => void;
  updateSessionImage: (id: string, updates: Partial<SessionImage>) => void;
  setDetectedTags: (tags: Tag[]) => void;
  toggleTagLock: (key: string) => void;
  removeTag: (key: string) => void;
  setSelectedPreset: (presetId: string | null) => void;
  setSelectedBrandStyle: (brandStyleId: string | null) => void;
  setCustomPrompt: (prompt: string) => void;
  openStudio: (productId: string) => void;
  closeStudio: () => void;
  reset: () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

// ============================================================================
// LOCAL STORAGE PERSISTENCE KEY
// ============================================================================

const STORAGE_KEY = 'studio-preferences';

interface StoredPreferences {
  selectedPresetId: string | null;
  selectedBrandStyleId: string | null;
  customPrompt: string;
}

function loadStoredPreferences(): Partial<StoredPreferences> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPreferences;
    return {
      selectedPresetId: parsed.selectedPresetId ?? null,
      selectedBrandStyleId: parsed.selectedBrandStyleId ?? null,
      customPrompt: parsed.customPrompt ?? '',
    };
  } catch {
    return {};
  }
}

function savePreferences(prefs: StoredPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently ignore storage errors (private browsing, quota exceeded)
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

export function StudioContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(studioReducer, initialState);

  // ---------------------------------------------------------------------------
  // Hydrate preferences from localStorage on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stored = loadStoredPreferences();
    if (stored.selectedPresetId !== undefined) {
      dispatch({ type: 'SET_PRESET', presetId: stored.selectedPresetId });
    }
    if (stored.selectedBrandStyleId !== undefined) {
      dispatch({ type: 'SET_BRAND_STYLE', brandStyleId: stored.selectedBrandStyleId });
    }
    if (stored.customPrompt !== undefined && stored.customPrompt !== '') {
      dispatch({ type: 'SET_CUSTOM_PROMPT', prompt: stored.customPrompt });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Persist preferences to localStorage on change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    savePreferences({
      selectedPresetId: state.selectedPresetId,
      selectedBrandStyleId: state.selectedBrandStyleId,
      customPrompt: state.customPrompt,
    });
  }, [state.selectedPresetId, state.selectedBrandStyleId, state.customPrompt]);

  // ---------------------------------------------------------------------------
  // Stable convenience callbacks
  // ---------------------------------------------------------------------------

  const setCurrentProduct = useCallback(
    (productId: string) => dispatch({ type: 'SET_PRODUCT', productId }),
    []
  );

  const setSelectedImage = useCallback(
    (id: string | null, type: 'source' | 'generated' | null) =>
      dispatch({ type: 'SELECT_IMAGE', id, imageType: type }),
    []
  );

  const setIsGenerating = useCallback(
    (isGenerating: boolean, sessionId?: string | null) => {
      if (isGenerating) {
        dispatch({ type: 'START_GENERATION', sessionId: sessionId ?? null });
      } else {
        dispatch({ type: 'STOP_GENERATION' });
      }
    },
    []
  );

  const setSessionImages = useCallback(
    (images: SessionImage[]) => dispatch({ type: 'SET_SESSION_IMAGES', images }),
    []
  );

  const addSessionImage = useCallback(
    (image: SessionImage) => dispatch({ type: 'ADD_SESSION_IMAGE', image }),
    []
  );

  const updateSessionImage = useCallback(
    (id: string, updates: Partial<SessionImage>) =>
      dispatch({ type: 'UPDATE_SESSION_IMAGE', id, updates }),
    []
  );

  const setDetectedTags = useCallback(
    (tags: Tag[]) => dispatch({ type: 'SET_DETECTED_TAGS', tags }),
    []
  );

  const toggleTagLock = useCallback(
    (key: string) => dispatch({ type: 'TOGGLE_TAG_LOCK', key }),
    []
  );

  const removeTag = useCallback(
    (key: string) => dispatch({ type: 'REMOVE_TAG', key }),
    []
  );

  const setSelectedPreset = useCallback(
    (presetId: string | null) => dispatch({ type: 'SET_PRESET', presetId }),
    []
  );

  const setSelectedBrandStyle = useCallback(
    (brandStyleId: string | null) => dispatch({ type: 'SET_BRAND_STYLE', brandStyleId }),
    []
  );

  const setCustomPrompt = useCallback(
    (prompt: string) => dispatch({ type: 'SET_CUSTOM_PROMPT', prompt }),
    []
  );

  const openStudio = useCallback(
    (productId: string) => dispatch({ type: 'OPEN_STUDIO', productId }),
    []
  );

  const closeStudio = useCallback(() => dispatch({ type: 'CLOSE_STUDIO' }), []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  // ---------------------------------------------------------------------------
  // Context value (stable reference for actions via useCallback)
  // ---------------------------------------------------------------------------

  const value: StudioContextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      setCurrentProduct,
      setSelectedImage,
      setIsGenerating,
      setSessionImages,
      addSessionImage,
      updateSessionImage,
      setDetectedTags,
      toggleTagLock,
      removeTag,
      setSelectedPreset,
      setSelectedBrandStyle,
      setCustomPrompt,
      openStudio,
      closeStudio,
      reset,
    }),
    [
      state,
      setCurrentProduct,
      setSelectedImage,
      setIsGenerating,
      setSessionImages,
      addSessionImage,
      updateSessionImage,
      setDetectedTags,
      toggleTagLock,
      removeTag,
      setSelectedPreset,
      setSelectedBrandStyle,
      setCustomPrompt,
      openStudio,
      closeStudio,
      reset,
    ]
  );

  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useStudioContext(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error(
      'useStudioContext must be used within a <StudioContextProvider>. ' +
        'Wrap your component tree with <StudioContextProvider> to fix this error.'
    );
  }
  return ctx;
}
