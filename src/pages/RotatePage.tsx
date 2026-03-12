/**
 * Rotate & Straighten Page
 * Supports 90°/180°/270° presets, custom angle slider, and flip operations.
 */
import { useState, useRef, useCallback } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function rotateAndFlip(
  img: HTMLImageElement,
  angleDeg: number,
  flipH: boolean,
  flipV: boolean
): string {
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const newW = Math.ceil(img.naturalWidth * cos + img.naturalHeight * sin);
  const newH = Math.ceil(img.naturalWidth * sin + img.naturalHeight * cos);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d')!;

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  return canvas.toDataURL('image/png');
}

export default function RotatePage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [angle, setAngle] = useState(0);
  const [customInput, setCustomInput] = useState('0');
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const apply = useCallback((a: number, fh: boolean, fv: boolean) => {
    if (!imgRef.current) return;
    setProcessedImage(rotateAndFlip(imgRef.current, a, fh, fv));
  }, []);

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
        apply(0, false, false);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const setAngleAndApply = (a: number) => {
    const clamped = Math.round(a) % 360;
    setAngle(clamped);
    setCustomInput(String(clamped));
    apply(clamped, flipH, flipV);
  };

  const toggleFlipH = () => {
    const next = !flipH;
    setFlipH(next);
    apply(angle, next, flipV);
  };

  const toggleFlipV = () => {
    const next = !flipV;
    setFlipV(next);
    apply(angle, flipH, next);
  };

  const { saveToHistory } = useSaveHistory();

  const download = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `${originalName}-rotated-${angle}deg.png`;
    a.click();
    const ops = [`Rotate ${angle}°`];
    if (flipH) ops.push('Flip H');
    if (flipV) ops.push('Flip V');
    saveToHistory(originalImage, processedImage, ops);
  };

  const reset = () => {
    setAngle(0);
    setCustomInput('0');
    setFlipH(false);
    setFlipV(false);
    if (imgRef.current) apply(0, false, false);
  };

  const PRESETS = [
    { label: '0°', value: 0 },
    { label: '90°', value: 90 },
    { label: '180°', value: 180 },
    { label: '270°', value: 270 },
    { label: '45°', value: 45 },
    { label: '−45°', value: -45 },
  ];

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
          <RotateCw className="h-4 w-4 text-indigo-400" />
          <span className="font-display text-sm font-bold text-foreground">Rotate & Straighten</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {processedImage && (
            <>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={download}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-5 overflow-y-auto">

          {/* Angle presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Angles</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setAngleAndApply(value)}
                  className={cn(
                    'rounded-lg border py-2 text-xs font-semibold transition-all',
                    angle === value && !flipH && !flipV
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fine Adjustment</Label>
              <span className="text-sm font-mono font-semibold text-indigo-400">{angle}°</span>
            </div>
            <Slider
              min={-180}
              max={180}
              step={1}
              value={[angle]}
              onValueChange={([v]) => setAngleAndApply(v)}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>−180°</span>
              <span>+180°</span>
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Custom Angle</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setAngleAndApply(Number(customInput));
                }}
                placeholder="e.g. 37"
                className="h-8 bg-surface-elevated border-surface-border text-xs font-mono flex-1"
              />
              <button
                onClick={() => setAngleAndApply(Number(customInput))}
                className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 text-xs font-medium text-indigo-400 hover:bg-indigo-500/20 transition-all"
              >
                Apply
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Enter any angle −360° to 360° and press Apply or Enter.</p>
          </div>

          {/* Flip */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Flip</Label>
            <div className="flex gap-2">
              <button
                onClick={toggleFlipH}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all',
                  flipH
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                )}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                Horizontal
              </button>
              <button
                onClick={toggleFlipV}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all',
                  flipV
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400'
                    : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                )}
              >
                <FlipVertical className="h-3.5 w-3.5" />
                Vertical
              </button>
            </div>
          </div>

          {/* Current state */}
          {(angle !== 0 || flipH || flipV) && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-1.5 text-xs">
              <p className="font-semibold text-indigo-400">Current Transform</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Angle</span><span className="font-mono">{angle}°</span>
              </div>
              {flipH && <div className="text-muted-foreground">↔ Flipped horizontally</div>}
              {flipV && <div className="text-muted-foreground">↕ Flipped vertically</div>}
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          {!originalImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging
                  ? 'border-indigo-500/50 bg-indigo-500/5'
                  : 'border-surface-border hover:border-indigo-500/30 hover:bg-surface-elevated'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">🔃</div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to rotate</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click · JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Original */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
                <div className="flex flex-1 items-center justify-center rounded-xl border border-surface-border bg-surface p-4 min-h-48">
                  <img src={originalImage} alt="Original" className="max-h-72 max-w-full object-contain rounded-lg" />
                </div>
              </div>

              {/* Rotated */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Result</span>
                  {(angle !== 0 || flipH || flipV) && (
                    <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-mono text-indigo-400">
                      {angle}°{flipH ? ' H' : ''}{flipV ? ' V' : ''}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-center rounded-xl border border-indigo-500/20 bg-surface p-4 min-h-48">
                  {processedImage ? (
                    <img src={processedImage} alt="Rotated" className="max-h-72 max-w-full object-contain rounded-lg animate-fade-in-up" />
                  ) : (
                    <p className="text-xs text-muted-foreground">Adjust angle to see result</p>
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
