import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Video,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { mediaApi, UploadMediaResult } from '../../api';

export interface TemplateMediaValue {
  headerValue?: string;
  mediaStorageKey?: string;
  filename?: string;
}

interface TemplateMediaUploaderProps {
  headerType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'TEXT';
  value?: TemplateMediaValue;
  onChange: (val: TemplateMediaValue) => void;
  allowVariables?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const MEDIA_CONFIG: Record<
  'IMAGE' | 'DOCUMENT' | 'VIDEO',
  {
    accept: string;
    maxSizeMB: number;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  IMAGE: {
    accept: 'image/jpeg,image/png,image/webp,image/jpg',
    maxSizeMB: 5,
    title: 'Upload Header Image',
    description: 'JPG, PNG, or WEBP (Max 5MB). Standard WhatsApp header aspect ratio is 1.91:1 or 16:9.',
    icon: ImageIcon,
  },
  VIDEO: {
    accept: 'video/mp4,video/3gpp,video/quicktime',
    maxSizeMB: 16,
    title: 'Upload Header Video',
    description: 'MP4 or 3GP (Max 16MB). Recommended format is H.264 video with AAC audio.',
    icon: Video,
  },
  DOCUMENT: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain',
    maxSizeMB: 100,
    title: 'Upload Header Document',
    description: 'PDF, DOCX, XLSX, CSV (Max 100MB). PDF is recommended for instant WhatsApp previews.',
    icon: FileText,
  },
};

export const TemplateMediaUploader: React.FC<TemplateMediaUploaderProps> = ({
  headerType,
  value,
  onChange,
  allowVariables = true,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (headerType === 'TEXT') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          type="text"
          value={value?.headerValue || ''}
          onChange={(e) => onChange({ ...value, headerValue: e.target.value })}
          placeholder="Enter text header or {{variable}}..."
          disabled={disabled}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white"
        />
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    );
  }

  const config = MEDIA_CONFIG[headerType] || MEDIA_CONFIG.IMAGE;
  const IconComponent = config.icon;

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validate size limit
    const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed size for ${headerType.toLowerCase()}s is ${config.maxSizeMB}MB.`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev && prev < 85 ? prev + 15 : prev));
      }, 150);

      const result = await mediaApi.upload(file);
      clearInterval(timer);
      setUploadProgress(100);

      onChange({
        headerValue: result.url || result.downloadUrl || result.fileUrl,
        mediaStorageKey: result.key,
        filename: result.filename || file.name,
      });
    } catch (err: any) {
      console.error('[TemplateMediaUploader] Upload failed:', err);
      setErrorMessage(err?.response?.data?.error || err?.message || 'Failed to upload media file.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange({
      headerValue: undefined,
      mediaStorageKey: undefined,
      filename: undefined,
    });
    setErrorMessage(null);
  };

  const hasSelectedMedia = Boolean(value?.mediaStorageKey || value?.headerValue);
  const isDirectUrlOrVar = Boolean(
    value?.headerValue &&
      !value?.mediaStorageKey &&
      (value.headerValue.startsWith('http') || value.headerValue.includes('{{'))
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label || `${headerType.charAt(0) + headerType.slice(1).toLowerCase()} Header Asset`}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>

        {allowVariables && (
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              URL / Variable
            </button>
          </div>
        )}
      </div>

      {/* Mode 1: File Upload & Preview */}
      {activeTab === 'upload' ? (
        <div>
          {hasSelectedMedia && !isUploading ? (
            <div className="relative border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                {/* Media Thumbnail or Type Icon */}
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {headerType === 'IMAGE' && value?.headerValue ? (
                    <img
                      src={value.headerValue}
                      alt="Header Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : headerType === 'VIDEO' ? (
                    <Video className="w-6 h-6 text-indigo-500" />
                  ) : (
                    <FileText className="w-6 h-6 text-amber-500" />
                  )}
                </div>

                {/* File info and status */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {value?.filename || `${headerType} Attached`}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {value?.mediaStorageKey
                      ? 'Stored on Cloud Storage (S3/MinIO)'
                      : value?.headerValue || 'Attached'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  title="Replace file"
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={disabled}
                  title="Remove attachment"
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center ${
                isDragOver
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-2 ring-primary-500/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 bg-slate-50/50 dark:bg-slate-900/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={config.accept}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
                disabled={disabled || isUploading}
                className="hidden"
              />

              {isUploading ? (
                <div className="py-2 flex flex-col items-center space-y-2">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Uploading {headerType.toLowerCase()} to object storage...
                  </p>
                  {uploadProgress !== null && (
                    <div className="w-36 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-1 flex flex-col items-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span className="text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {config.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Direct URL or Variable Interpolation */
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={value?.headerValue || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  headerValue: e.target.value,
                  mediaStorageKey: undefined,
                  filename: undefined,
                })
              }
              placeholder={`https://example.com/file.${headerType === 'IMAGE' ? 'jpg' : headerType === 'VIDEO' ? 'mp4' : 'pdf'} or {{contact.invoice_url}}`}
              disabled={disabled}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white"
            />
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
            <span>Pass a public HTTPS media link or dynamic variable tag like</span>
            <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-primary-600 dark:text-primary-400 font-mono">
              {'{{variable_name}}'}
            </code>
          </p>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start space-x-2 text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
