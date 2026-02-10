/**
 * ProductImageGallery Constants
 */

// Maximum file size in bytes (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Accepted image types
export const ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];

// Grid configuration
export const GRID_CONFIG = {
    cols: {
        default: 2,
        sm: 3,
        md: 4,
        lg: 5,
        xl: 6,
    },
    rowHeight: {
        default: 120,
        md: 140,
    },
};

// Gap sizes
export const GAP_SIZES = {
    sm: 8,
    md: 12,
    lg: 16,
};

// Thumbnail sizes
export const THUMBNAIL_SIZES = {
    small: 80,
    medium: 120,
    large: 160,
};

// Animation variants for Framer Motion
export const imageAnimationVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
};
