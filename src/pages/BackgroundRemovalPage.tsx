import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Eraser, Info, MousePointer2, Paintbrush } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Canvas-based background removal using flood-fill */
function removeBackground(imageData: ImageData, tolerance: number, edgeMode: boolean): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);
  output.set(data);

  const samplePoints = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)], [Math.floor(width / 2), height - 1],
  ];

  let sumR = 0, sumG = 0, sumB = 0;
  for (const [x, y] of samplePoints) {
    const idx = (y * width + x) * 4;
    sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
  }
  const bgR = sumR / samplePoints.length;
  const bgG = sumG / samplePoints.length;
  const bgB = sumB / samplePoints.length;

  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const colorDist = (idx: number) => {
    const dr = data[idx] - bgR;
    const dg = data[idx + 1] - bgG;
    const db = data[idx + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  for (let x = 0; x < width; x++) {
    queue.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width, y * width + (width - 1));
  }

  const scaledTol = tolerance * 2.5;

  let qi = 0;
  while (qi < queue.length) {
    const pos = queue[qi++];
    if (visited[pos]) continue;
    visited[pos] = 1;
    const idx = pos * 4;
    if (colorDist(idx) > scaledTol) continue;
    output[idx + 3] = 0;
    const x = pos % width;
    const y = Math.floor(pos / width);
    if (x > 0) queue.push(pos - 1);
    if (x < width - 1) queue.push(pos + 1);
    if (y > 0) queue.push(pos - width);
    if (y < height - 1) queue.push(pos + width);
  }

  if (edgeMode) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pos = y * width + x;
        const idx = pos * 4;
        if (output[idx + 3] > 0) {
          const neighbors = [pos - 1, pos + 1, pos - width, pos + width];
          const hasRemovedNeighbor = neighbors.some((n) => output[n * 4 + 3] === 0);
          if (hasRemovedNeighbor) {
            const dist = colorDist(idx);
            const alpha = Math.min(255, Math.round((dist / scaledTol) * 255));
            output[idx + 3] = Math.min(output[idx + 3], alpha);
          }
        }
      }
    }
  }

  return new ImageData(output, width, height);
}

type ToolMode = 'auto' | 'pointer';

export default function BackgroundRemovalPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tolerance, setTolerance] = useState(35);
  const [featherEdges, setFeatherEdges] = useState(true);
  const [processedSize, setProcessedSize] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('auto');
  const [brushSize, setBrushSize] = useState(20);
  const [isPainting, setIsPainting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedDataRef = useRef<ImageData | null>(null);

  const process = useCallback(
    (img: HTMLImageElement, tol: number, feather: boolean) => {
      setIsProcessing(true);
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = removeBackground(imageData, tol, feather);
        ctx.putImageData(result, 0, 0);
        processedDataRef.current = result;
        const dataUrl = canvas.toDataURL('image/png');
        setProcessedImage(dataUrl);
        const bytes = Math.round((dataUrl.split(',')[1].length * 3) / 4);
        setProcessedSize(bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        setIsProcessing(false);

        // Draw on visible canvas if in pointer mode
        if (canvasRef.current) {
          const vc = canvasRef.current;
          vc.width = img.naturalWidth;
          vc.height = img.naturalHeight;
          const vctx = vc.getContext('2d')!;
          vctx.putImageData(result, 0, 0);
        }
      }, 50);
    },
    []
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ''));
    setProcessedImage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        process(img, tolerance, featherEdges);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const reprocess = (tol: number, feather: boolean) => {
    if (imgRef.current) process(imgRef.current, tol, feather);
  };

  // Pointer painting: erase pixels under brush
  const paintErase = (e: React.MouseEvent) => {
    if (!canvasRef.current || !processedDataRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imgData;
    const r = brushSize;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = Math.round(cx + dx);
        const py = Math.round(cy + dy);
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const idx = (py * width + px) * 4;
        data[idx + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    processedDataRef.current = imgData;
    setProcessedImage(canvas.toDataURL('image/png'));
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (toolMode !== 'pointer') return;
    setIsPainting(true);
    paintErase(e);
  };

  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPainting || toolMode !== 'pointer') return;
    paintErase(e);
  };

  const onCanvasMouseUp = () => setIsPainting(false);

  const download = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `${originalName}-no-bg.png`;
    a.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    imgRef.current = null;
    processedDataRef.current = null;
    setProcessedSize(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 items-center gap-3 border-b border-surface-border bg-surface px-4 flex-shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </button>
        <div className="flex items-center gap-2">
          <Eraser className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold text-foreground">Background Removal</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {processedImage && (
            <button onClick={download} className="flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all">
              <Download className="h-3.5 w-3.5" /> Download PNG{processedSize ? ` (${processedSize})` : ''}
            </button>
          )}
          {originalImage && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> New image
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-5 overflow-y-auto">
          {/* Tool mode */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Removal Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setToolMode('auto')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all',
                  toolMode === 'auto'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                )}
              >
                <Eraser className="h-3.5 w-3.5" /> Auto
              </button>
              <button
                onClick={() => setToolMode('pointer')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all',
                  toolMode === 'pointer'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                )}
              >
                <Paintbrush className="h-3.5 w-3.5" /> Paint
              </button>
            </div>
          </div>

          {toolMode === 'pointer' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Brush Size</Label>
                <span className="text-sm font-mono font-semibold text-primary">{brushSize}px</span>
              </div>
              <Slider min={5} max={60} step={1} value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} />
              <p className="text-[10px] text-muted-foreground">Click and drag on the processed image to erase areas</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Color Tolerance</Label>
              <span className="text-sm font-mono font-semibold text-primary">{tolerance}</span>
            </div>
            <Slider
              min={5} max={100} step={1} value={[tolerance]}
              onValueChange={([v]) => { setTolerance(v); reprocess(v, featherEdges); }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>More precise</span><span>More aggressive</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Edge Feathering</Label>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => { setFeatherEdges(v); reprocess(tolerance, v); }}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all',
                    featherEdges === v
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v ? 'Smooth' : 'Sharp'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-elevated p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">How it works</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <strong>Auto:</strong> Flood-fill from edges to detect and remove backgrounds.<br />
              <strong>Paint:</strong> Click & drag to manually erase specific areas with a brush.
            </p>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {!originalImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging ? 'border-primary/50 bg-primary/5' : 'border-surface-border hover:border-primary/30 hover:bg-surface-elevated'
              )}
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">🪄</div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to remove background</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click · JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
                  <div className="relative flex items-center justify-center rounded-xl border border-surface-border bg-surface p-4 min-h-48">
                    <img src={originalImage} alt="Original" className="max-h-64 max-w-full object-contain rounded-lg" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Background Removed</span>
                    {processedSize && (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">PNG · {processedSize}</span>
                    )}
                    {toolMode === 'pointer' && (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary flex items-center gap-1">
                        <MousePointer2 className="h-2.5 w-2.5" /> Paint to erase
                      </span>
                    )}
                  </div>
                  <div
                    className="relative flex items-center justify-center rounded-xl border border-primary/20 min-h-48 p-4 overflow-hidden"
                    style={{ background: `repeating-conic-gradient(hsl(0 0% 15%) 0% 25%, hsl(0 0% 20%) 0% 50%) 0 0 / 20px 20px` }}
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-surface-border border-t-primary animate-spin-slow" />
                        <p className="text-xs text-muted-foreground">Removing background…</p>
                      </div>
                    ) : toolMode === 'pointer' && processedImage ? (
                      <canvas
                        ref={canvasRef}
                        className="max-h-64 max-w-full object-contain rounded-lg animate-fade-in-up"
                        style={{ cursor: 'crosshair' }}
                        onMouseDown={onCanvasMouseDown}
                        onMouseMove={onCanvasMouseMove}
                        onMouseUp={onCanvasMouseUp}
                        onMouseLeave={onCanvasMouseUp}
                      />
                    ) : processedImage ? (
                      <img src={processedImage} alt="No background" className="max-h-64 max-w-full object-contain rounded-lg animate-fade-in-up" />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => reprocess(tolerance, featherEdges)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
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
