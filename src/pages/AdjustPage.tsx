/**
 * Adjust Page — Brightness, Contrast, Saturation, Exposure, Highlights,
 * Shadows, Color Temperature, Tone, Vignette
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tone: number;
  vignette: number;
}

const DEFAULT: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tone: 0,
  vignette: 0,
};

const CONTROLS: { key: keyof Adjustments; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1 },
  { key: 'temperature', label: 'Color Temperature', min: -100, max: 100, step: 1 },
  { key: 'tone', label: 'Tone', min: -100, max: 100, step: 1 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100, step: 1 },
];

function applyAdjustments(img: HTMLImageElement, adj: Adjustments): string {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const brightnessF = adj.brightness / 100;
  const contrastF = adj.contrast / 100;
  const contrastMul = (259 * (contrastF * 255 + 255)) / (255 * (259 - contrastF * 255));
  const satF = adj.saturation / 100 + 1;
  const exposureF = Math.pow(2, adj.exposure / 100);
  const highlightF = adj.highlights / 100;
  const shadowF = adj.shadows / 100;
  const tempF = adj.temperature / 100;
  const toneF = adj.tone / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Exposure
    r *= exposureF; g *= exposureF; b *= exposureF;

    // Brightness
    r += brightnessF; g += brightnessF; b += brightnessF;

    // Contrast
    r = contrastMul * (r - 0.5) + 0.5;
    g = contrastMul * (g - 0.5) + 0.5;
    b = contrastMul * (b - 0.5) + 0.5;

    // Highlights & Shadows
    const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
    if (luma > 0.5) {
      const factor = 1 + highlightF * 0.5;
      r = luma + (r - luma) * factor; g = luma + (g - luma) * factor; b = luma + (b - luma) * factor;
    } else {
      const factor = 1 + shadowF * 0.5;
      r = luma + (r - luma) * factor; g = luma + (g - luma) * factor; b = luma + (b - luma) * factor;
    }

    // Saturation
    const gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
    r = gray + (r - gray) * satF;
    g = gray + (g - gray) * satF;
    b = gray + (b - gray) * satF;

    // Color Temperature (warm = +red -blue, cool = -red +blue)
    r += tempF * 0.1;
    b -= tempF * 0.1;

    // Tone (shift green channel)
    g += toneF * 0.05;

    data[i] = Math.min(255, Math.max(0, r * 255));
    data[i + 1] = Math.min(255, Math.max(0, g * 255));
    data[i + 2] = Math.min(255, Math.max(0, b * 255));
  }

  // Vignette
  if (adj.vignette > 0) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    const strength = adj.vignette / 100;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
        const vignette = 1 - dist * dist * strength;
        const idx = (y * canvas.width + x) * 4;
        data[idx] *= vignette;
        data[idx + 1] *= vignette;
        data[idx + 2] *= vignette;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export default function AdjustPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const applyLive = useCallback((adj: Adjustments) => {
    if (!imgRef.current) return;
    const result = applyAdjustments(imgRef.current, adj);
    setProcessedImage(result);
  }, []);

  const handleChange = (key: keyof Adjustments, value: number) => {
    const next = { ...adjustments, [key]: value };
    setAdjustments(next);
    applyLive(next);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ''));
    setAdjustments({ ...DEFAULT });
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      setProcessedImage(url);
      const img = new Image();
      img.onload = () => { imgRef.current = img; };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const { saveToHistory } = useSaveHistory();

  const download = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `${originalName}-adjusted.png`;
    a.click();
    const ops = Object.entries(adjustments)
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`);
    saveToHistory(originalImage, processedImage, ops.length > 0 ? ops : ['No adjustments']);
  };

  const resetAdjustments = () => {
    setAdjustments({ ...DEFAULT });
    if (originalImage) setProcessedImage(originalImage);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-14 items-center gap-3 border-b border-surface-border bg-surface px-4 flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </button>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-amber-400" />
          <span className="font-display text-sm font-bold text-foreground">Adjust & Tune</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {processedImage && originalImage && (
            <>
              <button
                onClick={resetAdjustments}
                className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={download}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Controls sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-4 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Adjustments
            </span>
            <button
              onClick={resetAdjustments}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Reset all
            </button>
          </div>

          {CONTROLS.map((ctrl) => (
            <div key={ctrl.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{ctrl.label}</Label>
                <span className="text-xs font-mono font-semibold text-foreground">
                  {adjustments[ctrl.key] > 0 ? '+' : ''}{adjustments[ctrl.key]}
                </span>
              </div>
              <Slider
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={[adjustments[ctrl.key]]}
                onValueChange={([v]) => handleChange(ctrl.key, v)}
                disabled={!originalImage}
              />
            </div>
          ))}
        </aside>

        {/* Main preview */}
        <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
          {!originalImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex w-full h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging ? 'border-amber-500/50 bg-amber-500/5' : 'border-surface-border hover:border-amber-500/30 hover:bg-surface-elevated'
              )}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">🎛️</div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to adjust</p>
              <p className="mt-1 text-sm text-muted-foreground">Brightness, Contrast, Saturation, Temperature & more</p>
            </div>
          ) : (
            <div className="max-w-2xl w-full">
              <div className="rounded-xl border border-surface-border bg-surface p-4">
                <img
                  src={processedImage || originalImage}
                  alt="Preview"
                  className="max-h-[60vh] w-full object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
