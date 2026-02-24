/**
 * ProductImageGallery Types
 */

export interface ProductImage {
    id: string | number;
    url: string;
    src?: string; // Alias for url
    alt?: string;
    name?: string;
    order?: number;
    isPrimary?: boolean;
}

export interface UploadingItem {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

export interface ProductImageGalleryProps {
    images: ProductImage[];
    uploadingItems?: UploadingItem[];
    onImagesChange: (images: ProductImage[]) => void;
    onUpload: (files: File[]) => Promise<void>;
    onUpdateAlt?: (image: ProductImage, alt: string) => void;
    onDownload?: (image: ProductImage) => void;
    onDelete?: (image: ProductImage) => Promise<void>;
    maxImages?: number;
    isLoading?: boolean;
    isDisabled?: boolean;
    allowDelete?: boolean;
    allowReorder?: boolean;
    showPrimaryBadge?: boolean;
    productTitle?: string;
    productId?: string;
    actionButton?: React.ReactNode;
}

export interface ImageValidationError {
    file: File;
    code: 'MAX_SIZE' | 'INVALID_TYPE' | 'MAX_COUNT';
    message: string;
}

export interface ImageValidationResult {
    valid: boolean;
    errors: ImageValidationError[];
    validFiles: File[];
}
