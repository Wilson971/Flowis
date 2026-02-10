/**
 * Photo Studio Hooks - Barrel exports
 */

// Generation sessions
export {
  useGenerationSessions,
  useCreateGenerationSession,
  usePublishGenerationSession,
  useDeleteGenerationSession,
} from './useGenerationSessions';

// Scene generation
export { useSceneGeneration } from './useSceneGeneration';
export { useSceneGenerationMachine } from './useSceneGenerationMachine';

// Brand styles CRUD
export {
  useBrandStyles,
  useCreateBrandStyle,
  useUpdateBrandStyle,
  useDeleteBrandStyle,
} from './useBrandStyles';

// Studio jobs CRUD + polling
export {
  useStudioJobs,
  useCreateStudioJob,
  useUpdateStudioJob,
} from './useStudioJobs';

// Batch studio operations
export { useCreateBatchJobs, useBatchProgress } from './useBatchStudioJobs';

// Image persistence
export { useSaveGeneratedImage } from './useSaveGeneratedImage';
