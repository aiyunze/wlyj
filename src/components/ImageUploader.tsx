"use client";

import { useRef, useState, useCallback } from "react";

interface ImageUploaderProps {
  images: { id: string; url: string; file_name: string }[];
  onAdd: (file: File) => Promise<{ id: string; url: string; file_name: string } | null>;
  onRemove: (id: string) => void;
  maxCount?: number;
}

export default function ImageUploader({ images, onAdd, onRemove, maxCount = 9 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      e.target.value = "";

      if (images.length >= maxCount) {
        setError(`最多上传 ${maxCount} 张图片`);
        return;
      }

      setError("");
      setUploading(true);
      try {
        await onAdd(file);
      } catch {
        setError("上传失败");
      } finally {
        setUploading(false);
      }
    },
    [images.length, maxCount, onAdd]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm text-bark/70">
          图片附件 <span className="text-sepia/50 text-xs">(选填，最多{maxCount}张，单张≤20MB)</span>
        </label>
        {images.length < maxCount && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-moss hover:text-moss/70 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                </svg>
                上传中...
              </span>
            ) : (
              "+ 添加图片"
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-rust text-xs mb-2">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-sm overflow-hidden border border-sepia/20">
              <img
                src={img.url}
                alt={img.file_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewId(img.id)}
              />
              <button
                type="button"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rust/80 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(img.id)}
              >
                x
              </button>
            </div>
          ))}
          {images.length < maxCount && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square border-2 border-dashed border-sepia/30 rounded-sm flex items-center justify-center text-sepia/40 hover:border-sepia/50 hover:text-sepia/60 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {previewId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setPreviewId(null)}
        >
          <img
            src={images.find((i) => i.id === previewId)?.url}
            alt="预览"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setPreviewId(null)}
          >
            x
          </button>
        </div>
      )}
    </div>
  );
}
