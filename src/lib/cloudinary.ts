/**
 * Cloudinary Upload Utilities
 * 
 * Uses unsigned uploads with a preset configured in Cloudinary Dashboard.
 * This allows direct browser-to-Cloudinary uploads without exposing API secrets.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'weddingbazaarus';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  original_filename: string;
  created_at: string;
  folder?: string;
}

export interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
  transformation?: string;
  publicId?: string;
  tags?: string[];
  onProgress?: (progress: number) => void;
}

export interface UploadError {
  message: string;
  code?: string;
}

/**
 * Upload a file to Cloudinary
 * @param file - File to upload
 * @param options - Upload options
 * @returns Promise with upload result or error
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'wedding-bazaar',
    resourceType = 'auto',
    publicId,
    tags = [],
    onProgress,
  } = options;

  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  // Debug: Log configuration
  console.log('Cloudinary upload config:', { cloudName: CLOUD_NAME, preset: UPLOAD_PRESET, folder });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);
  
  if (publicId) {
    formData.append('public_id', publicId);
  }
  
  if (tags.length > 0) {
    formData.append('tags', tags.join(','));
  }

  // Determine endpoint based on resource type
  const endpoint = `${CLOUDINARY_URL}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result as CloudinaryUploadResult);
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        console.error('Cloudinary upload failed:', {
          status: xhr.status,
          response: xhr.responseText,
          preset: UPLOAD_PRESET,
          cloudName: CLOUD_NAME,
        });
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          const errorMessage = errorResponse.error?.message || `Upload failed with status ${xhr.status}`;
          reject(new Error(errorMessage));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}. Make sure the Cloudinary upload preset "${UPLOAD_PRESET}" exists and is set to unsigned.`));
        }
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });
    
    xhr.open('POST', endpoint);
    xhr.send(formData);
  });
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Promise with array of upload results
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];
  const errors: { file: string; error: UploadError }[] = [];

  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file, options);
      results.push(result);
    } catch (error) {
      errors.push({ file: file.name, error: error as UploadError });
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed: ${errors.map(e => e.file).join(', ')}`);
  }

  return results;
}

/**
 * Get optimized image URL with transformations
 * @param publicId - Cloudinary public ID or URL
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    gravity?: 'auto' | 'face' | 'center';
  } = {}
): string {
  // If it's already a full URL, extract the public_id portion
  if (publicId.includes('cloudinary.com')) {
    return publicId; // Return as-is for now
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto',
  } = options;

  const transformations: string[] = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (gravity && (width || height)) transformations.push(`g_${gravity}`);

  const transformString = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}${publicId}`;
}

/**
 * Get thumbnail URL for any file type
 * @param result - Upload result from Cloudinary
 * @param size - Thumbnail size
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(
  result: CloudinaryUploadResult,
  size: number = 100
): string {
  if (result.resource_type === 'image') {
    return getOptimizedImageUrl(result.public_id, {
      width: size,
      height: size,
      crop: 'thumb',
    });
  }
  
  // For documents (PDF, etc.), use Cloudinary's thumbnail generation
  if (result.format === 'pdf') {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${size},h_${size},c_fill,pg_1/${result.public_id}.jpg`;
  }
  
  // For other file types, return a placeholder or icon URL
  return `/icons/file-${result.format || 'generic'}.svg`;
}

/**
 * Delete a file from Cloudinary (requires server-side implementation)
 * For security, deletion should be done via your backend API
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // This should call your backend API which has the API secret
  const response = await fetch('/api/cloudinary/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete file');
  }
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 10,
    allowedTypes,
    allowedExtensions,
  } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  if (allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} is not allowed`,
      };
    }
  }

  return { valid: true };
}

// Common file type configurations
export const FILE_CONFIGS: Record<string, {
  allowedTypes: string[];
  allowedExtensions: string[];
  maxSizeMB: number;
}> = {
  images: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxSizeMB: 5,
  },
  documents: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10,
  },
  portfolio: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeMB: 8,
  },
};
