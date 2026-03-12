/**
 * Background Removal Page
 * Uses canvas-based background removal via edge detection + flood-fill alpha masking.
 * For best results with a real AI model, connect a remove.bg API key via Cloud secrets.
 */
import { useState, useRef, useCallback } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Eraser, Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Canvas-based background removal using edge + tolerance flood-fill */
function removeBackground(
  imageData: ImageData,
  tolerance: number = 35,
  edgeMode: boolean = true
): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);
  output.set(data);

  // Sample the background color from four corners + center-edges
  const samplePoints = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)], [Math.floor(width / 2), height - 1],
  ];

  // Average the background color samples
  let sumR = 0, sumG = 0, sumB = 0;
  for (const [x, y] of samplePoints) {
    const idx = (y * width + x) * 4;
    sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
  }
  const bgR = sumR / samplePoints.length;
  const bgG = sumG / samplePoints.length;
  const bgB = sumB / samplePoints.length;

  // Build a visited mask for BFS flood-fill from edges
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const colorDist = (idx: number) => {
    const dr = data[idx] - bgR;
    const dg = data[idx + 1] - bgG;
    const db = data[idx + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  // Seed BFS from all 4 borders
  for (let x = 0; x < width; x++) {
    queue.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width, y * width + (width - 1));
  }

  const scaledTol = tolerance * 2.5; // map 0-100 → 0-255 range

  let qi = 0;
  while (qi < queue.length) {
    const pos = queue[qi++];
    if (visited[pos]) continue;
    visited[pos] = 1;
    const idx = pos * 4;
    if (colorDist(idx) > scaledTol) continue;
    // Mark as transparent
    output[idx + 3] = 0;
    // Push 4-neighbors
    const x = pos % width;
    const y = Math.floor(pos / width);
    if (x > 0) queue.push(pos - 1);
    if (x < width - 1) queue.push(pos + 1);
    if (y > 0) queue.push(pos - width);
    if (y < height - 1) queue.push(pos + width);
  }

  // Feather edges: semi-transparent near removed regions
  if (edgeMode) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pos = y * width + x;
        const idx = pos * 4;
        if (output[idx + 3] > 0) {
          // Check if any neighbor was removed
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
        const dataUrl = canvas.toDataURL('image/png');
        setProcessedImage(dataUrl);
        // Estimate size
        const bytes = Math.round((dataUrl.split(',')[1].length * 3) / 4);
        setProcessedSize(bytes < 1024 * 1024
          ? `${(bytes / 1024).toFixed(1)} KB`
          : `${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        setIsProcessing(false);
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

  const { saveToHistory } = useSaveHistory();

  const download = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `${originalName}-no-bg.png`;
    a.click();
    saveToHistory(originalImage, processedImage, ['Background Removal']);
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    imgRef.current = null;
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
          {processedImage && (
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

          {/* Tolerance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Color Tolerance</Label>
              <span className="text-sm font-mono font-semibold text-rose-400">{tolerance}</span>
            </div>
            <Slider
              min={5}
              max={100}
              step={1}
              value={[tolerance]}
              onValueChange={([v]) => {
                setTolerance(v);
                reprocess(v, featherEdges);
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>More precise</span>
              <span>More aggressive</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Increase if the background isn't fully removed. Decrease if subject colors are being removed.
            </p>
          </div>

          {/* Feather edges */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Edge Feathering</Label>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => {
                    setFeatherEdges(v);
                    reprocess(tolerance, v);
                  }}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all',
                    featherEdges === v
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v ? 'Smooth' : 'Sharp'}
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
              Uses edge-seeded flood-fill to detect and remove uniform backgrounds. Works best on images with solid or near-solid colored backgrounds (white, grey, studio backdrops).
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Output is always a transparent <strong className="text-foreground">PNG</strong>.
            </p>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-rose-400">Best results with:</p>
            {['Solid white / grey backgrounds', 'High contrast subjects', 'Studio product photos', 'Profile photos on plain backgrounds'].map((t) => (
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
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                const f = e.dataTransfer.files[0]; if (f) handleFile(f);
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">
                🪄
              </div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to remove background</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click · JPG, PNG, WebP</p>
              <p className="mt-0.5 text-xs text-muted-foreground/50">Works best with solid / studio backgrounds</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Comparison grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
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
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Background Removed</span>
                    {processedSize && (
                      <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono text-rose-400">
                        PNG · {processedSize}
                      </span>
                    )}
                  </div>
                  <div
                    className="relative flex items-center justify-center rounded-xl border border-rose-500/20 min-h-48 p-4 overflow-hidden"
                    style={{
                      background: `repeating-conic-gradient(hsl(218 22% 12%) 0% 25%, hsl(218 22% 16%) 0% 50%) 0 0 / 20px 20px`,
                    }}
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-2 border-surface-border border-t-rose-400 animate-spin-slow" />
                        <p className="text-xs text-muted-foreground">Removing background…</p>
                      </div>
                    ) : processedImage ? (
                      <img
                        src={processedImage}
                        alt="No background"
                        className="max-h-64 max-w-full object-contain rounded-lg animate-fade-in-up"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Reprocess button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => reprocess(tolerance, featherEdges)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  {isProcessing ? 'Processing…' : 'Reprocess with current settings'}
                </button>
                <p className="text-xs text-muted-foreground">
                  Adjust tolerance slider and click Reprocess to fine-tune results
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
