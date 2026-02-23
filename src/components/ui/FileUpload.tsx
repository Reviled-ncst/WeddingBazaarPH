'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  uploadToCloudinary, 
  uploadMultipleToCloudinary,
  validateFile, 
  CloudinaryUploadResult,
  FILE_CONFIGS,
  getThumbnailUrl 
} from '@/lib/cloudinary';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  publicId: string;
  type: string;
  size: number;
  uploadedAt: string;
  thumbnail?: string;
}

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  folder?: string;
  fileType?: keyof typeof FILE_CONFIGS;
  value?: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  hint?: string;
}

export function FileUpload({
  label = 'Upload Files',
  accept,
  multiple = false,
  maxFiles = 5,
  maxSizeMB,
  folder = 'wedding-bazaar/documents',
  fileType = 'documents',
  value = [],
  onChange,
  onError,
  className = '',
  disabled = false,
  hint,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = FILE_CONFIGS[fileType];
  const effectiveMaxSize = maxSizeMB || config.maxSizeMB;
  const effectiveAccept = accept || config.allowedTypes.join(',');

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (value.length + fileArray.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const validation = validateFile(file, {
        maxSizeMB: effectiveMaxSize,
        allowedTypes: config.allowedTypes,
        allowedExtensions: config.allowedExtensions,
      });
      
      if (!validation.valid) {
        onError?.(validation.error || 'Invalid file');
        return;
      }
    }

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of fileArray) {
        const fileId = `${Date.now()}-${file.name}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        const result = await uploadToCloudinary(file, {
          folder,
          resourceType: file.type.startsWith('image/') ? 'image' : 'raw',
          onProgress: (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          },
        });

        newFiles.push({
          id: result.public_id,
          name: result.original_filename || file.name,
          url: result.secure_url,
          publicId: result.public_id,
          type: file.type,
          size: result.bytes,
          uploadedAt: result.created_at,
          thumbnail: result.resource_type === 'image' 
            ? getThumbnailUrl(result, 80)
            : undefined,
        });

        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }

      onChange([...value, ...newFiles]);
    } catch (error) {
      console.error('Upload error:', error);
      // Handle both standard Error and our UploadError type
      const errorMessage = (error as { message?: string })?.message 
        || (error instanceof Error ? error.message : 'Upload failed. Make sure the Cloudinary upload preset is configured.');
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [value, maxFiles, effectiveMaxSize, config, folder, onChange, onError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" />;
    }
    return <FileText className="w-5 h-5 text-pink-400" />;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-2">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragActive 
            ? 'border-pink-400 bg-pink-500/10' 
            : 'border-dark-600 hover:border-dark-500 bg-dark-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={effectiveAccept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            <p className="text-sm text-dark-300">Uploading...</p>
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="w-full max-w-xs">
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className={`w-8 h-8 ${dragActive ? 'text-pink-400' : 'text-dark-500'}`} />
            <div>
              <p className="text-sm text-dark-200">
                <span className="text-pink-400 font-medium">Click to upload</span>
                {' '}or drag and drop
              </p>
              <p className="text-xs text-dark-500 mt-1">
                {config.allowedExtensions.map(e => e.toUpperCase()).join(', ')} up to {effectiveMaxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {hint && (
        <p className="text-xs text-dark-500 mt-1.5">{hint}</p>
      )}

      {/* Uploaded files list */}
      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          {value.map((file, index) => (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg border border-dark-700"
            >
              {/* Thumbnail or icon */}
              {file.thumbnail ? (
                <img 
                  src={file.thumbnail} 
                  alt={file.name}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-dark-700 flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-dark-400">{formatFileSize(file.size)}</p>
              </div>

              {/* Status and remove */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 hover:bg-dark-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-dark-400 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files count */}
      {multiple && (
        <p className="text-xs text-dark-500 mt-2">
          {value.length} of {maxFiles} files uploaded
        </p>
      )}
    </div>
  );
}

// Image-specific upload component with preview
interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange: (url: string | null, publicId?: string) => void;
  onError?: (error: string) => void;
  folder?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'cover';
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ImageUpload({
  label,
  value,
  onChange,
  onError,
  folder = 'wedding-bazaar/images',
  aspectRatio = 'square',
  className = '',
  disabled = false,
  placeholder,
  size = 'md',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-video',
    cover: 'aspect-[3/1]',
  };

  const handleFile = async (file: File) => {
    const validation = validateFile(file, FILE_CONFIGS.images);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid image');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const result = await uploadToCloudinary(file, {
        folder,
        resourceType: 'image',
        onProgress: setProgress,
      });
      onChange(result.secure_url, result.public_id);
    } catch (error) {
      console.error('Image upload error:', error);
      onError?.((error as Error).message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-dark-200 mb-2">
          {label}
        </label>
      )}

      <div className={`relative ${aspectRatio === 'square' ? sizeClasses[size] : ''}`}>
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          className={`
            relative overflow-hidden rounded-xl border-2 border-dashed transition-all cursor-pointer
            ${value ? 'border-transparent' : 'border-dark-600 hover:border-dark-500'}
            ${aspectClasses[aspectRatio]}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {value ? (
            <>
              <img
                src={value}
                alt="Uploaded"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-dark-900/80 rounded-full hover:bg-red-500/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </>
          ) : isUploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-2" />
              <div className="w-3/4 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800/50">
              <ImageIcon className="w-8 h-8 text-dark-500 mb-2" />
              <p className="text-xs text-dark-400 text-center px-2">
                {placeholder || 'Click to upload'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
