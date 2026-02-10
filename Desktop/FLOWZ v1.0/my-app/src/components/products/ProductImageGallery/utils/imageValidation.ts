/**
 * Image Validation Utilities
 */

import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "../constants";
import { ImageValidationResult, ImageValidationError } from "../types";

interface ValidationOptions {
    maxCount?: number;
    currentCount?: number;
    maxSize?: number;
    acceptedTypes?: string[];
}

/**
 * Valide une liste de fichiers image
 */
export function validateImageFiles(
    files: File[],
    options: ValidationOptions = {}
): ImageValidationResult {
    const {
        maxCount = 15,
        currentCount = 0,
        maxSize = MAX_FILE_SIZE,
        acceptedTypes = ACCEPTED_IMAGE_TYPES,
    } = options;

    const errors: ImageValidationError[] = [];
    const validFiles: File[] = [];

    // Vérifier le nombre maximum
    const remainingSlots = maxCount - currentCount;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Vérifier si on dépasse le max
        if (validFiles.length >= remainingSlots) {
            errors.push({
                file,
                code: 'MAX_COUNT',
                message: `Maximum ${maxCount} images autorisées. ${file.name} ignorée.`,
            });
            continue;
        }

        // Vérifier le type
        if (!acceptedTypes.includes(file.type)) {
            errors.push({
                file,
                code: 'INVALID_TYPE',
                message: `${file.name}: Type non supporté. Utilisez JPG, PNG ou WebP.`,
            });
            continue;
        }

        // Vérifier la taille
        if (file.size > maxSize) {
            errors.push({
                file,
                code: 'MAX_SIZE',
                message: `${file.name}: Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB).`,
            });
            continue;
        }

        validFiles.push(file);
    }

    return {
        valid: validFiles.length > 0 && errors.length === 0,
        errors,
        validFiles,
    };
}

/**
 * Génère un ID unique pour une image uploadée
 */
export function generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extrait le nom de fichier sans extension
 */
export function getFileNameWithoutExtension(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '');
}
