/**
 * Image Enhance & Clarity Page
 * Sharpen, noise reduction, auto contrast, low-light enhancement.
 * All processing via Canvas API — no server uploads.
 */
import { useState, useRef, useCallback } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Unsharp mask — sharpens by amplifying high-frequency detail */
function sharpenImage(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const src = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let acc = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            acc += src[((y + ky) * width + (x + kx)) * 4 + ch] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const orig = src[(y * width + x) * 4 + ch];
        data[(y * width + x) * 4 + ch] = Math.min(255, Math.max(0,
          orig + (acc - orig) * (strength / 100)
        ));
      }
    }
  }
}

/** Simple bilateral-like noise reduction via box averaging */
function reduceNoise(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
  const src = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0, count = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            sum += src[(py * width + px) * 4 + ch];
            count++;
          }
        }
        data[(y * width + x) * 4 + ch] = Math.round(sum / count);
      }
    }
  }
}

/** Auto contrast stretch (per-channel histogram stretching) */
function autoContrast(data: Uint8ClampedArray): void {
  for (let ch = 0; ch < 3; ch++) {
    let min = 255, max = 0;
    for (let i = ch; i < data.length; i += 4) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    if (max === min) continue;
    const range = max - min;
    for (let i = ch; i < data.length; i += 4) {
      data[i] = Math.round(((data[i] - min) / range) * 255);
    }
  }
}

/** Low-light enhancement via gamma correction + shadow lift */
function enhanceLowLight(data: Uint8ClampedArray, strength: number): void {
  const gamma = 1 / (1 + strength / 80); // gamma < 1 brightens
  const lift = strength * 0.3; // lift shadows
  for (let i = 0; i < data.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const norm = data[i + ch] / 255;
      const gammaApplied = Math.pow(norm, gamma) * 255;
      // Shadow lift
      const lifted = gammaApplied + lift * (1 - norm);
      data[i + ch] = Math.min(255, Math.max(0, Math.round(lifted)));
    }
  }
}

interface EnhanceSettings {
  sharpen: number;
  noise: number;
  autoContrast: boolean;
  lowLight: number;
}

export default function EnhancePage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [settings, setSettings] = useState<EnhanceSettings>({
    sharpen: 50,
    noise: 0,
    autoContrast: false,
    lowLight: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const process = useCallback((img: HTMLImageElement, s: EnhanceSettings) => {
    setIsProcessing(true);
    const start = performance.now();
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      // Apply in order: noise reduction → sharpen → auto contrast → low-light
      if (s.noise > 0) reduceNoise(data, width, height, Math.round(s.noise / 33));
      if (s.sharpen > 0) sharpenImage(data, width, height, s.sharpen);
      if (s.autoContrast) autoContrast(data);
      if (s.lowLight > 0) enhanceLowLight(data, s.lowLight);

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL('image/jpeg', 0.95));
      setProcessingTime(Math.round(performance.now() - start));
      setIsProcessing(false);
    }, 30);
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
        process(img, settings);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const updateSetting = <K extends keyof EnhanceSettings>(key: K, value: EnhanceSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (imgRef.current) process(imgRef.current, next);
  };

  const { saveToHistory } = useSaveHistory();

  const download = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `${originalName}-enhanced.jpg`;
    a.click();
    saveToHistory(originalImage, processedImage, ['Enhance - Sharpen/Denoise/Contrast/Low-light']);
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
          <Sparkles className="h-4 w-4 text-sky-400" />
          <span className="font-display text-sm font-bold text-foreground">Enhance & Clarity</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {processingTime !== null && (
            <span className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-mono text-success">
              ⚡ {processingTime}ms
            </span>
          )}
          {processedImage && (
            <button
              onClick={download}
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
          {originalImage && (
            <button
              onClick={() => { setOriginalImage(null); setProcessedImage(null); imgRef.current = null; }}
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

          {/* Sharpen */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">✨ Sharpen</Label>
              <span className="text-sm font-mono font-semibold text-sky-400">{settings.sharpen}%</span>
            </div>
            <Slider
              min={0} max={100} step={5}
              value={[settings.sharpen]}
              onValueChange={([v]) => updateSetting('sharpen', v)}
            />
            <p className="text-[10px] text-muted-foreground">Enhances fine detail and edge clarity. Natural colors preserved.</p>
          </div>

          {/* Noise Reduction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">🔇 Noise Reduction</Label>
              <span className="text-sm font-mono font-semibold text-sky-400">{settings.noise}%</span>
            </div>
            <Slider
              min={0} max={100} step={10}
              value={[settings.noise]}
              onValueChange={([v]) => updateSetting('noise', v)}
            />
            <p className="text-[10px] text-muted-foreground">Reduces grain and ISO noise from low-light shots.</p>
          </div>

          {/* Auto Contrast */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">🎚️ Auto Contrast</Label>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => updateSetting('autoContrast', v)}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-semibold transition-all',
                    settings.autoContrast === v
                      ? 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v ? 'On' : 'Off'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Stretches histogram to full tonal range. Improves flat, washed-out images.</p>
          </div>

          {/* Low Light Enhancement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">🌙 Low-Light Boost</Label>
              <span className="text-sm font-mono font-semibold text-sky-400">{settings.lowLight}%</span>
            </div>
            <Slider
              min={0} max={100} step={5}
              value={[settings.lowLight]}
              onValueChange={([v]) => updateSetting('lowLight', v)}
            />
            <p className="text-[10px] text-muted-foreground">Brightens dark images with gamma correction and shadow lifting. Colors stay natural.</p>
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Presets</Label>
            <div className="space-y-1.5">
              {[
                { label: '📷 Portrait Touch-up', s: { sharpen: 40, noise: 30, autoContrast: false, lowLight: 0 } },
                { label: '🌃 Night Photo Fix', s: { sharpen: 30, noise: 60, autoContrast: true, lowLight: 60 } },
                { label: '🖼️ Max Clarity', s: { sharpen: 90, noise: 0, autoContrast: true, lowLight: 0 } },
                { label: '🔄 Reset All', s: { sharpen: 0, noise: 0, autoContrast: false, lowLight: 0 } },
              ].map(({ label, s }) => (
                <button
                  key={label}
                  onClick={() => {
                    setSettings(s);
                    if (imgRef.current) process(imgRef.current, s);
                  }}
                  className="w-full text-left rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-sky-500/30 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
                  ? 'border-sky-500/50 bg-sky-500/5'
                  : 'border-surface-border hover:border-sky-500/30 hover:bg-surface-elevated'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">✨</div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to enhance</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click · JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
                <div className="flex items-center justify-center rounded-xl border border-surface-border bg-surface p-4 min-h-48">
                  <img src={originalImage} alt="Original" className="max-h-80 max-w-full object-contain rounded-lg" />
                </div>
              </div>

              {/* Enhanced */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Enhanced</span>
                <div className="relative flex items-center justify-center rounded-xl border border-sky-500/20 bg-surface p-4 min-h-48">
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm z-10">
                      <div className="h-8 w-8 rounded-full border-2 border-surface-border border-t-sky-400 animate-spin-slow" />
                    </div>
                  )}
                  {processedImage && (
                    <img src={processedImage} alt="Enhanced" className="max-h-80 max-w-full object-contain rounded-lg animate-fade-in-up" />
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
