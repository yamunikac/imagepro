import { useState, useRef, useCallback } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Minimize2, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function dataUrlToBytes(dataUrl: string): number {
  // base64 encoded size → approximate original byte count
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

export default function CompressPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalName, setOriginalName] = useState<string>('image');
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState(75);
  const [maxWidthPct, setMaxWidthPct] = useState(100);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const compress = useCallback(
    (img: HTMLImageElement, q: number, pct: number, fmt: string) => {
      const scale = pct / 100;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL(fmt, fmt === 'image/png' ? undefined : q / 100);
      setCompressedImage(dataUrl);
      setCompressedSize(dataUrlToBytes(dataUrl));
    },
    []
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ''));
    setOriginalSize(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        compress(img, quality, maxWidthPct, format);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSettingChange = (q: number, pct: number, fmt: string) => {
    if (imgRef.current) compress(imgRef.current, q, pct, fmt);
  };

  const { saveToHistory } = useSaveHistory();

  const download = () => {
    if (!compressedImage) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const a = document.createElement('a');
    a.href = compressedImage;
    a.download = `${originalName}-compressed.${ext}`;
    a.click();
    saveToHistory(originalImage, compressedImage, [`Compress - Quality ${quality}%`]);
  };

  const reset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    imgRef.current = null;
    setQuality(75);
    setMaxWidthPct(100);
    setFormat('image/jpeg');
  };

  const savings = originalSize > 0 && compressedSize > 0
    ? Math.max(0, Math.round((1 - compressedSize / originalSize) * 100))
    : 0;

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
          <Minimize2 className="h-4 w-4 text-amber-400" />
          <span className="font-display text-sm font-bold text-foreground">Compress & Resize</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Controls sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-5 overflow-y-auto">
          {/* Format */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Output Format</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['image/jpeg', 'image/webp', 'image/png'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFormat(f);
                    handleSettingChange(quality, maxWidthPct, f);
                  }}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs font-semibold transition-all',
                    format === f
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f === 'image/jpeg' ? 'JPEG' : f === 'image/webp' ? 'WebP' : 'PNG'}
                </button>
              ))}
            </div>
            {format === 'image/png' && (
              <p className="text-[10px] text-muted-foreground">PNG is lossless — quality slider has no effect.</p>
            )}
          </div>

          {/* Quality */}
          {format !== 'image/png' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quality</Label>
                <span className="text-sm font-mono font-semibold text-amber-400">{quality}%</span>
              </div>
              <Slider
                min={5}
                max={100}
                step={1}
                value={[quality]}
                onValueChange={([v]) => {
                  setQuality(v);
                  handleSettingChange(v, maxWidthPct, format);
                }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {/* Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Scale</Label>
              <span className="text-sm font-mono font-semibold text-amber-400">{maxWidthPct}%</span>
            </div>
            <Slider
              min={10}
              max={100}
              step={5}
              value={[maxWidthPct]}
              onValueChange={([v]) => {
                setMaxWidthPct(v);
                handleSettingChange(quality, v, format);
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Smaller dimensions</span>
              <span>Original size</span>
            </div>
          </div>

          {/* Stats */}
          {originalSize > 0 && compressedSize > 0 && (
            <div className="rounded-xl border border-surface-border bg-surface-elevated p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Original</span>
                <span className="font-mono text-foreground">{formatBytes(originalSize)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Compressed</span>
                <span className="font-mono text-amber-400">{formatBytes(compressedSize)}</span>
              </div>
              <div className="h-px bg-surface-border" />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Savings</span>
                <span className={cn('font-mono font-bold', savings > 0 ? 'text-success' : 'text-muted-foreground')}>
                  {savings > 0 ? `−${savings}%` : 'No change'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {compressedImage && (
              <button
                onClick={download}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <Download className="h-4 w-4" />
                Download ({formatBytes(compressedSize)})
              </button>
            )}
            {originalImage && (
              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                New image
              </button>
            )}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 p-6 overflow-auto">
          {!originalImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-surface-border hover:border-amber-500/30 hover:bg-surface-elevated'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">
                ⚡
              </div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to compress</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click to browse · JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0">
              {/* Original */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
                  <span className="text-xs font-mono text-muted-foreground">{formatBytes(originalSize)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center rounded-xl border border-surface-border bg-surface p-4 min-h-48">
                  <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
              </div>

              {/* Compressed */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Compressed</span>
                  <span className="text-xs font-mono text-amber-400">{formatBytes(compressedSize)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center rounded-xl border border-amber-500/20 bg-surface p-4 min-h-48">
                  {compressedImage && (
                    <img src={compressedImage} alt="Compressed" className="max-h-full max-w-full object-contain rounded-lg" />
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
