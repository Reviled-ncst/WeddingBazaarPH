'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Shield,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { 
  uploadToCloudinary, 
  validateFile, 
  FILE_CONFIGS,
  CloudinaryUploadResult 
} from '@/lib/cloudinary';

export interface VerificationDocument {
  id: string;
  name: string;
  url: string;
  publicId: string;
  type: string;
  size: number;
  uploadedAt: string;
  thumbnail?: string;
}

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number;
  businessName: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: string | null;
  existingDocuments: VerificationDocument[];
  hasLocation: boolean;
  onSubmit: (documents: VerificationDocument[]) => Promise<void>;
}

const REQUIRED_DOCUMENTS = [
  { name: 'Business Registration (DTI/SEC)', required: true },
  { name: 'BIR Registration (Form 2303)', required: true },
  { name: 'Business/Mayor\'s Permit', required: true },
  { name: 'Valid Government ID', required: true },
  { name: 'Proof of Address (optional)', required: false },
];

export function VerificationModal({
  isOpen,
  onClose,
  vendorId,
  businessName,
  verificationStatus,
  verificationNotes,
  verifiedAt,
  existingDocuments,
  hasLocation,
  onSubmit,
}: VerificationModalProps) {
  // For rejected status, start with empty documents for fresh resubmission
  const [documents, setDocuments] = useState<VerificationDocument[]>(
    verificationStatus === 'rejected' ? [] : existingDocuments
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Can only upload when unverified or rejected
  const canUpload = verificationStatus === 'unverified' || verificationStatus === 'rejected';

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !canUpload) return;
    
    setError(null);
    const fileArray = Array.from(files);

    // Validate files
    for (const file of fileArray) {
      const validation = validateFile(file, FILE_CONFIGS.documents);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
    }

    // Check max files - for rejected status, replace all; otherwise add to existing
    const totalFiles = verificationStatus === 'rejected' ? fileArray.length : documents.length + fileArray.length;
    if (totalFiles > 10) {
      setError('Maximum 10 files allowed');
      return;
    }

    setIsUploading(true);
    const newDocs: VerificationDocument[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(Math.round(((i) / fileArray.length) * 100));

        const result: CloudinaryUploadResult = await uploadToCloudinary(file, {
          folder: `wedding-bazaar/verification/${vendorId}`,
          resourceType: file.type.startsWith('image/') ? 'image' : 'raw',
          onProgress: (progress) => {
            const baseProgress = (i / fileArray.length) * 100;
            const fileProgress = (progress / fileArray.length);
            setUploadProgress(Math.round(baseProgress + fileProgress));
          },
        });

        newDocs.push({
          id: result.public_id,
          name: file.name,
          url: result.secure_url,
          publicId: result.public_id,
          type: file.type,
          size: result.bytes,
          uploadedAt: result.created_at,
        });
      }

      // For rejected status, replace all documents; otherwise append
      if (verificationStatus === 'rejected') {
        setDocuments(newDocs);
      } else {
        setDocuments(prev => [...prev, ...newDocs]);
      }
      setUploadProgress(100);
    } catch (err) {
      console.error('Upload error:', err);
      setError((err as Error).message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [canUpload, documents.length, vendorId]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canUpload) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, [canUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (canUpload && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [canUpload, handleFiles]);

  const handleSubmit = async () => {
    if (documents.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    if (!hasLocation) {
      setError('Please set your business location in your profile first');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(documents);
    } catch (err) {
      setError((err as Error).message || 'Failed to submit verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeDocument = (index: number) => {
    if (!canUpload) return;
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Business Verification</h2>
              <p className="text-sm text-dark-400">{businessName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Status Banner */}
          {verificationStatus === 'verified' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-semibold text-green-400">Verified Business</p>
                  <p className="text-sm text-green-300/80">
                    Your business has been verified on {verifiedAt ? new Date(verifiedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-400 animate-pulse" />
                <div>
                  <p className="font-semibold text-blue-400">Verification In Progress</p>
                  <p className="text-sm text-blue-300/80">
                    Your documents are being reviewed. This typically takes 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="mb-6">
              {/* Rejection Notice */}
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-400">Verification Rejected</p>
                    {verificationNotes && (
                      <p className="text-sm text-red-300/80 mt-1">
                        <strong>Reason:</strong> {verificationNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Fresh Start Notice */}
              <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Upload className="w-6 h-6 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-pink-400">Upload New Documents</p>
                    <p className="text-sm text-pink-300/80 mt-1">
                      Previous documents have been cleared. Please upload corrected documents below.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Show previously rejected docs as reference */}
              {existingDocuments.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-dark-400 cursor-pointer hover:text-dark-300">
                    View previously rejected documents ({existingDocuments.length})
                  </summary>
                  <div className="mt-2 p-3 bg-dark-800/50 rounded-lg border border-dark-700">
                    <div className="grid grid-cols-2 gap-2">
                      {existingDocuments.map((doc, idx) => (
                        <div key={idx} className="text-xs text-dark-500 truncate">
                          ?? {doc.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}
            </div>
          )}

          {verificationStatus === 'unverified' && (
            <div className="mb-6 p-4 bg-dark-800 border border-dark-700 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="font-semibold text-white">Get Verified</p>
                  <p className="text-sm text-dark-400">
                    Upload your business documents to get a verified badge and increase customer trust.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Required Documents List */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-dark-300 mb-3">Required Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQUIRED_DOCUMENTS.map((doc, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-xs text-dark-400 p-2 bg-dark-800/50 rounded-lg"
                >
                  <span className={doc.required ? 'text-pink-400' : 'text-dark-500'}>
                    {doc.required ? '•' : '?'}
                  </span>
                  {doc.name}
                </div>
              ))}
            </div>
          </div>

          {/* Drop Zone - Only show when can upload */}
          {canUpload && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isUploading && inputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-6
                ${dragActive 
                  ? 'border-pink-400 bg-pink-500/10' 
                  : 'border-dark-600 hover:border-dark-500 bg-dark-800/50'
                }
                ${isUploading ? 'pointer-events-none' : ''}
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isUploading}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
                  <p className="text-sm text-dark-300">Uploading documents...</p>
                  <div className="w-full max-w-xs h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-dark-500">{uploadProgress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className={`w-10 h-10 ${dragActive ? 'text-pink-400' : 'text-dark-500'}`} />
                  <div>
                    <p className="text-sm text-dark-200">
                      <span className="text-pink-400 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-dark-500 mt-1">
                      PDF, JPG, PNG up to 10MB each
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Uploaded Documents List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-dark-300 mb-2">
                {verificationStatus === 'rejected' 
                  ? 'New Documents for Resubmission' 
                  : canUpload 
                    ? 'Uploaded Documents' 
                    : 'Submitted Documents'}
              </h3>
              {documents.map((doc, index) => (
                <div 
                  key={doc.id || index}
                  className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg border border-dark-700"
                >
                  {/* Icon/Thumbnail */}
                  <div className="w-10 h-10 rounded bg-dark-700 flex items-center justify-center flex-shrink-0">
                    {doc.type?.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-pink-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{doc.name}</p>
                    <p className="text-xs text-dark-500">
                      {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status/Actions */}
                  <div className="flex items-center gap-2">
                    {canUpload ? (
                      <button
                        onClick={() => removeDocument(index)}
                        className="p-1.5 hover:bg-dark-700 rounded transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4 text-dark-400 hover:text-red-400" />
                      </button>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-900 border-t border-dark-700 px-6 py-4 flex justify-between gap-3">
          <Button variant="outline" onClick={onClose}>
            {canUpload ? 'Cancel' : 'Close'}
          </Button>
          {canUpload && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || documents.length === 0 || isUploading}
              style={
                isSubmitting || documents.length === 0 || isUploading
                  ? {
                      backgroundColor: '#374151',
                      color: '#9ca3af',
                      border: '2px solid #4b5563',
                      cursor: 'not-allowed',
                    }
                  : verificationStatus === 'rejected'
                    ? {
                        backgroundColor: '#ec4899',
                        color: '#ffffff',
                        border: '3px solid #f9a8d4',
                        boxShadow: '0 0 25px rgba(236, 72, 153, 0.6)',
                      }
                    : {
                        backgroundColor: '#22c55e',
                        color: '#ffffff',
                        border: '2px solid #86efac',
                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                      }
              }
              className="inline-flex items-center justify-center min-w-[240px] px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : verificationStatus === 'rejected' ? (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Resubmit Documents
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit for Verification
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
