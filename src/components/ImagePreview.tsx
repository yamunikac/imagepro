import { useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  originalImage: string | null;
  processedImage: string | null;
  isProcessing: boolean;
  processingTime: number | null;
  onDownload: () => void;
}

type ViewMode = 'split' | 'original' | 'processed';

export function ImagePreview({
  originalImage,
  processedImage,
  isProcessing,
  processingTime,
  onDownload,
}: ImagePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [zoom, setZoom] = useState(100);

  const zoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 25));

  if (!originalImage) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div className="space-y-3">
          <div className="mx-auto h-20 w-20 rounded-full border-2 border-dashed border-surface-border flex items-center justify-center">
            <span className="text-3xl opacity-30">🖼️</span>
          </div>
          <p className="text-muted-foreground text-sm">Upload an image to start processing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* View mode tabs */}
        <div className="flex rounded-lg border border-surface-border bg-surface p-0.5 text-xs">
          {(['split', 'original', 'processed'] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium capitalize transition-all',
                viewMode === m
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Processing time badge */}
          {processingTime !== null && (
            <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-mono text-success">
              ⚡ {processingTime}ms
            </span>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface p-0.5">
            <button
              onClick={zoomOut}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center text-xs font-mono text-muted-foreground">{zoom}%</span>
            <button
              onClick={zoomIn}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Download */}
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 hover:border-primary/50 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* Image panels */}
      <div className={cn('flex flex-1 gap-3 overflow-hidden rounded-xl min-h-0', viewMode === 'split' ? 'flex-row' : 'flex-col')}>
        {/* Original panel */}
        {(viewMode === 'split' || viewMode === 'original') && (
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-border bg-surface">
            <div className="absolute left-3 top-3 z-10 rounded-md border border-surface-border bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              Original
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={originalImage}
                alt="Original"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                className="max-h-full max-w-full rounded-lg object-contain transition-transform duration-200"
              />
            </div>
          </div>
        )}

        {/* Processed panel */}
        {(viewMode === 'split' || viewMode === 'processed') && (
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-border bg-surface">
            <div className="absolute left-3 top-3 z-10 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
              Processed
            </div>

            {/* Loading overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/80 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-full border-2 border-surface-border border-t-primary animate-spin-slow" />
                <p className="text-sm text-muted-foreground">Processing…</p>
              </div>
            )}

            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              {processedImage && (
                <img
                  src={processedImage}
                  alt="Processed"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                  className="max-h-full max-w-full rounded-lg object-contain transition-transform duration-200 animate-fade-in-up"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
