/**
 * Background Removal Page
 * Uses @imgly/background-removal for ML-based segmentation in the browser.
 */
import { useState, useRef, useCallback } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Eraser, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BackgroundRemovalPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [blurredBgImage, setBlurredBgImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processedSize, setProcessedSize] = useState<string | null>(null);
  const [mode, setMode] = useState<'remove' | 'blur'>('remove');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (dataUrl: string) => {
    setIsProcessing(true);
    try {
      // Step 1: Load the image as a blob
      setProcessingStep('Loading ML model…');
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Dynamically import the heavy ML library
      const { removeBackground } = await import('@imgly/background-removal');

      // Step 2: Run ML-based background removal
      setProcessingStep('Detecting subject…');
      const resultBlob = await removeBackground(blob, {
        progress: (key: string, current: number, total: number) => {
          if (key === 'compute:inference') {
            setProcessingStep(`Segmenting… ${Math.round((current / total) * 100)}%`);
          }
        },
      });

      // Convert result to data URL
      const reader = new FileReader();
      const removedUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(resultBlob);
      });

      setProcessedImage(removedUrl);

      // Step 3: Create blurred background version
      setProcessingStep('Creating blurred background…');
      const blurredUrl = await createBlurredBackground(dataUrl, removedUrl);
      setBlurredBgImage(blurredUrl);

      // Estimate size
      const bytes = Math.round((removedUrl.split(',')[1].length * 3) / 4);
      setProcessedSize(
        bytes < 1024 * 1024
          ? `${(bytes / 1024).toFixed(1)} KB`
          : `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      );
    } catch (err) {
      console.error('Background removal failed:', err);
      setProcessingStep('Error — try a different image');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, []);

  /**
   * Creates a version with the background blurred and subject sharp.
   * Uses the transparent-bg result as a mask.
   */
  const createBlurredBackground = async (
    originalUrl: string,
    transparentUrl: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const origImg = new Image();
      const maskImg = new Image();
      let loaded = 0;

      const onBothLoaded = () => {
        loaded++;
        if (loaded < 2) return;

        const canvas = document.createElement('canvas');
        canvas.width = origImg.naturalWidth;
        canvas.height = origImg.naturalHeight;
        const ctx = canvas.getContext('2d')!;

        // Draw blurred background
        ctx.filter = 'blur(20px)';
        ctx.drawImage(origImg, 0, 0);
        ctx.filter = 'none';

        // Draw sharp subject on top (the transparent-bg image)
        ctx.drawImage(maskImg, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      };

      origImg.onload = onBothLoaded;
      maskImg.onload = onBothLoaded;
      origImg.src = originalUrl;
      maskImg.src = transparentUrl;
    });
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ''));
    setProcessedImage(null);
    setBlurredBgImage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      processImage(url);
    };
    reader.readAsDataURL(file);
  };

  const { saveToHistory } = useSaveHistory();

  const currentResult = mode === 'blur' ? blurredBgImage : processedImage;

  const download = () => {
    if (!currentResult) return;
    const a = document.createElement('a');
    a.href = currentResult;
    a.download = `${originalName}-${mode === 'blur' ? 'blurred-bg' : 'no-bg'}.png`;
    a.click();
    saveToHistory(originalImage, currentResult, [
      mode === 'blur' ? 'Background Blur' : 'Background Removal',
    ]);
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setBlurredBgImage(null);
    setProcessedSize(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-3 border-b border-surface-border bg-surface px-4 flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </button>
        <div className="flex items-center gap-2">
          <Eraser className="h-4 w-4 text-rose-400" />
          <span className="font-display text-sm font-bold text-foreground">Background Removal</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {currentResult && (
            <button
              onClick={download}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG{processedSize ? ` (${processedSize})` : ''}
            </button>
          )}
          {originalImage && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New image
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-5 overflow-y-auto">
          {/* Mode toggle */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Output Mode
            </span>
            <div className="flex gap-2">
              {([
                { id: 'remove' as const, label: 'Remove BG' },
                { id: 'blur' as const, label: 'Blur BG' },
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all',
                    mode === m.id
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-xl border border-surface-border bg-surface-elevated p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">How it works</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Uses an ML neural network running in your browser (ONNX) to detect the subject with pixel-level accuracy. No server uploads needed.
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Remove BG:</strong> Outputs transparent PNG.
              <br />
              <strong className="text-foreground">Blur BG:</strong> Keeps subject sharp, blurs the background.
            </p>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-rose-400">Works great with:</p>
            {[
              'People & portraits',
              'Products & objects',
              'Animals & pets',
              'Any background type',
            ].map((t) => (
              <div key={t} className="flex items-start gap-1.5">
                <span className="text-rose-400 text-[10px] mt-0.5">✓</span>
                <span className="text-[10px] text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 p-6 overflow-auto">
          {!originalImage ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : 'border-surface-border hover:border-rose-500/30 hover:bg-surface-elevated'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">
                🪄
              </div>
              <p className="font-display text-lg font-semibold text-foreground">
                Upload image to remove background
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag & drop or click · JPG, PNG, WebP
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/50">
                AI-powered · Works with any background
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Comparison grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Original
                  </span>
                  <div className="relative flex items-center justify-center rounded-xl border border-surface-border bg-surface p-4 min-h-48">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="max-h-64 max-w-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Processed */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      {mode === 'blur' ? 'Blurred Background' : 'Background Removed'}
                    </span>
                    {processedSize && !isProcessing && (
                      <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono text-rose-400">
                        PNG · {processedSize}
                      </span>
                    )}
                  </div>
                  <div
                    className="relative flex items-center justify-center rounded-xl border border-rose-500/20 min-h-48 p-4 overflow-hidden"
                    style={
                      mode === 'remove'
                        ? {
                            background: `repeating-conic-gradient(hsl(var(--surface-elevated)) 0% 25%, hsl(var(--surface)) 0% 50%) 0 0 / 20px 20px`,
                          }
                        : { backgroundColor: 'hsl(var(--surface))' }
                    }
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-surface-border border-t-rose-400 animate-spin-slow" />
                        <p className="text-xs text-muted-foreground">{processingStep || 'Processing…'}</p>
                      </div>
                    ) : currentResult ? (
                      <img
                        src={currentResult}
                        alt="Result"
                        className="max-h-64 max-w-full object-contain rounded-lg animate-fade-in-up"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Reprocess */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => originalImage && processImage(originalImage)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  {isProcessing ? 'Processing…' : 'Reprocess'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
