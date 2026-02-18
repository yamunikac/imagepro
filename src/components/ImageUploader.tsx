import { useCallback, useRef, useState } from 'react';
import { Upload, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/image\/(jpeg|jpg|png|webp|gif)/)) return;
      onUpload(file);
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer',
        'bg-surface hover:bg-surface-elevated',
        isDragging
          ? 'border-primary scale-[1.01] shadow-glow bg-surface-elevated'
          : 'border-surface-border hover:border-primary/50'
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      {/* Animated glow when dragging */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl bg-primary/5 pointer-events-none" />
      )}

      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300',
          isDragging
            ? 'border-primary bg-primary/10 scale-110'
            : 'border-surface-border bg-surface-elevated'
        )}
      >
        {isDragging ? (
          <ImageIcon className="h-9 w-9 text-primary" />
        ) : (
          <Upload className="h-9 w-9 text-muted-foreground" />
        )}
      </div>

      <div className="text-center space-y-2">
        <p className="font-display text-lg font-semibold text-foreground">
          {isDragging ? 'Drop to upload' : 'Drag & drop your image'}
        </p>
        <p className="text-sm text-muted-foreground">
          or <span className="text-primary font-medium">click to browse</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Supports JPG, PNG, WebP · Max 20MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
