import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { useImageHistory } from '@/contexts/ImageHistoryContext';
import {
  Eraser, Sparkles, SunDim, Palette, Focus, Layers, Minimize2, FileSymlink,
  Crop, RotateCw, Upload, Download, Loader2, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  applyGrayscale, applySepia, applyInvert, applyGaussianBlur, applySharpen,
  applyEdgeDetection, applyEmboss, applyBrightnessContrast, applyCartoon
} from '@/lib/imageProcessing';

const features = [
  { id: 'bg-removal', icon: Eraser, label: 'BG Remove', description: 'Automatically remove image backgrounds and output transparent PNG.' },
  { id: 'bg-blur', icon: Focus, label: 'BG Blur', description: 'Blur the background while keeping the subject sharp and focused.' },
  { id: 'enhance', icon: Sparkles, label: 'Enhance', description: 'Sharpen details, reduce noise, auto-contrast and fix low-light photos.' },
  { id: 'color', icon: Palette, label: 'Color Adjust', description: 'Adjust brightness, contrast, saturation, and apply color grading.' },
  { id: 'filters', icon: Layers, label: 'Filters', description: 'Apply artistic filters: grayscale, sepia, cartoon, edge detection, emboss and more.' },
  { id: 'compress', icon: Minimize2, label: 'Compress', description: 'Reduce file size while maintaining quality. Control compression level.' },
  { id: 'convert', icon: FileSymlink, label: 'Convert', description: 'Convert between PNG, JPEG, WebP formats instantly.' },
  { id: 'crop', icon: Crop, label: 'Crop', description: 'Crop to custom dimensions or use preset aspect ratios.' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate', description: 'Rotate by any angle, flip horizontal or vertical.' },
];

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState('bg-removal');
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToHistory } = useImageHistory();

  // Color adjustments state
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [blurRadius, setBlurRadius] = useState(5);
  const [quality, setQuality] = useState(70);
  const [convertFormat, setConvertFormat] = useState('image/jpeg');
  const [rotation, setRotation] = useState(0);

  const active = features.find(f => f.id === activeFeature)!;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Max 10MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setProcessedImage(null); };
    reader.readAsDataURL(file);
  };

  const getCanvas = useCallback((): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; img: HTMLImageElement }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve({ canvas, ctx, img });
      };
      img.src = image!;
    });
  }, [image]);

  const processImage = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const { canvas, ctx, img } = await getCanvas();
      let resultUrl: string;

      switch (activeFeature) {
        case 'bg-removal': {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imageData.data;
          // Simple edge-based background removal (sample corners)
          const corners = [
            [0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]
          ];
          let bgR = 0, bgG = 0, bgB = 0;
          corners.forEach(([x, y]) => {
            const i = (y * canvas.width + x) * 4;
            bgR += d[i]; bgG += d[i + 1]; bgB += d[i + 2];
          });
          bgR /= 4; bgG /= 4; bgB /= 4;
          const tolerance = 60;
          for (let i = 0; i < d.length; i += 4) {
            const dist = Math.sqrt((d[i] - bgR) ** 2 + (d[i + 1] - bgG) ** 2 + (d[i + 2] - bgB) ** 2);
            if (dist < tolerance) d[i + 3] = 0;
          }
          ctx.putImageData(imageData, 0, 0);
          resultUrl = canvas.toDataURL('image/png');
          break;
        }
        case 'bg-blur': {
          // Create blurred version then composite with original center
          const blurCanvas = document.createElement('canvas');
          blurCanvas.width = canvas.width;
          blurCanvas.height = canvas.height;
          const blurCtx = blurCanvas.getContext('2d')!;
          blurCtx.filter = `blur(${blurRadius}px)`;
          blurCtx.drawImage(img, 0, 0);
          // Draw original center (ellipse mask)
          blurCtx.filter = 'none';
          blurCtx.save();
          blurCtx.beginPath();
          blurCtx.ellipse(canvas.width / 2, canvas.height / 2, canvas.width * 0.3, canvas.height * 0.4, 0, 0, Math.PI * 2);
          blurCtx.clip();
          blurCtx.drawImage(img, 0, 0);
          blurCtx.restore();
          resultUrl = blurCanvas.toDataURL('image/png');
          break;
        }
        case 'enhance': {
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          imageData = applySharpen(imageData);
          // Auto contrast
          const d2 = imageData.data;
          const mins = [255, 255, 255], maxs = [0, 0, 0];
          for (let i = 0; i < d2.length; i += 4) {
            for (let c = 0; c < 3; c++) {
              if (d2[i + c] < mins[c]) mins[c] = d2[i + c];
              if (d2[i + c] > maxs[c]) maxs[c] = d2[i + c];
            }
          }
          for (let i = 0; i < d2.length; i += 4) {
            for (let c = 0; c < 3; c++) {
              const range = maxs[c] - mins[c] || 1;
              d2[i + c] = ((d2[i + c] - mins[c]) / range) * 255;
            }
          }
          ctx.putImageData(imageData, 0, 0);
          resultUrl = canvas.toDataURL('image/png');
          break;
        }
        case 'color': {
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          imageData = applyBrightnessContrast(imageData, brightness, contrast);
          // Saturation adjustment
          const d3 = imageData.data;
          const sat = saturation / 100;
          for (let i = 0; i < d3.length; i += 4) {
            const gray = d3[i] * 0.2126 + d3[i + 1] * 0.7152 + d3[i + 2] * 0.0722;
            d3[i] = Math.min(255, Math.max(0, gray + (d3[i] - gray) * sat));
            d3[i + 1] = Math.min(255, Math.max(0, gray + (d3[i + 1] - gray) * sat));
            d3[i + 2] = Math.min(255, Math.max(0, gray + (d3[i + 2] - gray) * sat));
          }
          ctx.putImageData(imageData, 0, 0);
          resultUrl = canvas.toDataURL('image/png');
          break;
        }
        case 'filters': {
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // Apply selected filter (use grayscale as demo, we'll add a sub-selector)
          imageData = applyCartoon(imageData);
          ctx.putImageData(imageData, 0, 0);
          resultUrl = canvas.toDataURL('image/png');
          break;
        }
        case 'compress': {
          resultUrl = canvas.toDataURL('image/jpeg', quality / 100);
          break;
        }
        case 'convert': {
          resultUrl = canvas.toDataURL(convertFormat, 0.92);
          break;
        }
        case 'crop': {
          // Center crop 80%
          const cw = Math.floor(canvas.width * 0.8);
          const ch = Math.floor(canvas.height * 0.8);
          const sx = Math.floor((canvas.width - cw) / 2);
          const sy = Math.floor((canvas.height - ch) / 2);
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cw;
          cropCanvas.height = ch;
          cropCanvas.getContext('2d')!.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
          resultUrl = cropCanvas.toDataURL('image/png');
          break;
        }
        case 'rotate': {
          const rad = (rotation * Math.PI) / 180;
          const sin = Math.abs(Math.sin(rad));
          const cos = Math.abs(Math.cos(rad));
          const nw = Math.ceil(img.width * cos + img.height * sin);
          const nh = Math.ceil(img.width * sin + img.height * cos);
          const rc = document.createElement('canvas');
          rc.width = nw;
          rc.height = nh;
          const rctx = rc.getContext('2d')!;
          rctx.translate(nw / 2, nh / 2);
          rctx.rotate(rad);
          rctx.drawImage(img, -img.width / 2, -img.height / 2);
          resultUrl = rc.toDataURL('image/png');
          break;
        }
        default:
          resultUrl = canvas.toDataURL('image/png');
      }

      setProcessedImage(resultUrl);
    } catch (e) {
      console.error('Processing error:', e);
    }
    setProcessing(false);
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const ext = processedImage.includes('image/png') ? 'png' : processedImage.includes('image/webp') ? 'webp' : 'jpg';
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `visionpro-${active.label.toLowerCase()}.${ext}`;
    a.click();

    // Save to history
    addToHistory(active.label, processedImage);
  };

  // Filter sub-options
  const [selectedFilter, setSelectedFilter] = useState('cartoon');
  const filterOptions = [
    { id: 'grayscale', label: 'Grayscale' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'invert', label: 'Invert' },
    { id: 'cartoon', label: 'Cartoon' },
    { id: 'edge', label: 'Edge Detect' },
    { id: 'emboss', label: 'Emboss' },
    { id: 'blur', label: 'Blur' },
    { id: 'sharpen', label: 'Sharpen' },
  ];

  const processFilter = async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const { canvas, ctx } = await getCanvas();
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      switch (selectedFilter) {
        case 'grayscale': imageData = applyGrayscale(imageData); break;
        case 'sepia': imageData = applySepia(imageData); break;
        case 'invert': imageData = applyInvert(imageData); break;
        case 'cartoon': imageData = applyCartoon(imageData); break;
        case 'edge': imageData = applyEdgeDetection(imageData); break;
        case 'emboss': imageData = applyEmboss(imageData); break;
        case 'blur': imageData = applyGaussianBlur(imageData, 5); break;
        case 'sharpen': imageData = applySharpen(imageData); break;
      }
      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL('image/png'));
    } catch (e) { console.error(e); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — tool icons */}
        <aside className="w-16 sm:w-20 flex-shrink-0 border-r border-surface-border bg-surface flex flex-col items-center py-4 gap-1 overflow-y-auto scrollbar-thin">
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFeature(f.id); setProcessedImage(null); }}
              title={f.label}
              className={cn(
                'flex flex-col items-center gap-1 w-14 sm:w-16 py-2.5 rounded-xl text-[10px] font-medium transition-all duration-200',
                activeFeature === f.id
                  ? 'bg-primary/15 text-primary shadow-glow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )}
            >
              <f.icon className="h-5 w-5" />
              <span className="truncate">{f.label}</span>
            </button>
          ))}
        </aside>

        {/* Center — image preview */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-auto bg-background">
          {!image ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-surface-border bg-surface/50 backdrop-blur-sm p-12 sm:p-16 hover:border-primary/40 hover:bg-surface transition-all duration-300 w-full max-w-lg"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-semibold text-foreground">Upload an Image</p>
                <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP · Max 10MB</p>
              </div>
            </button>
          ) : (
            <div className="w-full max-w-2xl space-y-4">
              <div className="relative rounded-xl border border-surface-border bg-surface overflow-hidden shadow-studio-md">
                <img
                  src={processedImage || image}
                  alt="Preview"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
                {processing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium text-foreground">Processing...</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 rounded-lg bg-surface/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-mono text-muted-foreground border border-surface-border">
                  {processedImage ? 'Processed' : 'Original'}
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-surface-border bg-surface-elevated px-4 py-2 text-xs font-medium text-foreground hover:border-primary/30 transition-all">
                  Change Image
                </button>
                {processedImage && (
                  <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                )}
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
        </main>

        {/* Right panel — controls */}
        <aside className="w-72 sm:w-80 flex-shrink-0 border-l border-surface-border bg-surface overflow-y-auto scrollbar-thin p-5 hidden md:block">
          <h2 className="font-display text-lg font-bold text-foreground mb-1">{active.label}</h2>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{active.description}</p>

          {/* Feature-specific controls */}
          {activeFeature === 'color' && (
            <div className="space-y-5">
              <SliderControl label="Brightness" value={brightness} min={-100} max={100} onChange={setBrightness} />
              <SliderControl label="Contrast" value={contrast} min={-100} max={100} onChange={setContrast} />
              <SliderControl label="Saturation" value={saturation} min={0} max={200} onChange={setSaturation} />
            </div>
          )}

          {activeFeature === 'bg-blur' && (
            <SliderControl label="Blur Intensity" value={blurRadius} min={1} max={20} onChange={setBlurRadius} />
          )}

          {activeFeature === 'compress' && (
            <SliderControl label="Quality" value={quality} min={10} max={100} onChange={setQuality} suffix="%" />
          )}

          {activeFeature === 'convert' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Output Format</label>
              <div className="grid grid-cols-3 gap-2">
                {['image/jpeg', 'image/png', 'image/webp'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setConvertFormat(fmt)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                      convertFormat === fmt
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-surface-border bg-surface-elevated text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    {fmt.split('/')[1].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFeature === 'rotate' && (
            <div className="space-y-4">
              <SliderControl label="Angle" value={rotation} min={0} max={360} onChange={setRotation} suffix="°" />
              <div className="grid grid-cols-3 gap-2">
                {[90, 180, 270].map(deg => (
                  <button key={deg} onClick={() => setRotation(deg)} className="rounded-lg border border-surface-border bg-surface-elevated px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFeature === 'filters' && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Select Filter</label>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                      selectedFilter === f.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-surface-border bg-surface-elevated text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={activeFeature === 'filters' ? processFilter : processImage}
              disabled={!image || processing}
              className="w-full rounded-xl gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow disabled:opacity-40 transition-all duration-200"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                `Apply ${active.label}`
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, onChange, suffix = '' }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="text-xs font-mono text-primary">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-surface-elevated accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow-sm"
      />
    </div>
  );
}
