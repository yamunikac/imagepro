/**
 * Creative Edit Page — Blur, Erase, Stickers overlay
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Paintbrush, Eraser, Smile } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type EditMode = 'blur' | 'erase' | 'sticker';

const STICKERS = ['⭐', '❤️', '🔥', '😎', '🎉', '✨', '🌈', '👍', '💯', '🎨', '🦋', '🌸'];

export default function CreativeEditPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [isDragging, setIsDragging] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('blur');
  const [brushSize, setBrushSize] = useState(30);
  const [blurIntensity, setBlurIntensity] = useState(10);
  const [selectedSticker, setSelectedSticker] = useState('⭐');
  const [stickerSize, setStickerSize] = useState(40);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawBaseImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    // Also size overlay
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      overlay.width = img.naturalWidth;
      overlay.height = img.naturalHeight;
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        drawBaseImage();
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    drawBaseImage();
  }, [drawBaseImage]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    if (editMode === 'sticker') {
      const { x, y } = getCanvasPos(e);
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.font = `${stickerSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedSticker, x, y);
      return;
    }
    isDrawingRef.current = true;
    handleDraw(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    handleDraw(e);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { x, y } = getCanvasPos(e);

    if (editMode === 'erase') {
      // Erase to white
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (editMode === 'blur') {
      // Local blur: read region, blur it, put back
      const r = brushSize;
      const sx = Math.max(0, Math.floor(x - r));
      const sy = Math.max(0, Math.floor(y - r));
      const sw = Math.min(canvas.width - sx, r * 2);
      const sh = Math.min(canvas.height - sy, r * 2);
      if (sw <= 0 || sh <= 0) return;

      const regionData = ctx.getImageData(sx, sy, sw, sh);
      // Simple box blur
      const d = regionData.data;
      const blurR = Math.max(1, Math.floor(blurIntensity / 3));
      const temp = new Uint8ClampedArray(d.length);
      temp.set(d);

      for (let py = blurR; py < sh - blurR; py++) {
        for (let px = blurR; px < sw - blurR; px++) {
          let rr = 0, gg = 0, bb = 0, count = 0;
          for (let dy = -blurR; dy <= blurR; dy++) {
            for (let dx = -blurR; dx <= blurR; dx++) {
              const idx = ((py + dy) * sw + (px + dx)) * 4;
              rr += d[idx]; gg += d[idx + 1]; bb += d[idx + 2]; count++;
            }
          }
          const idx = (py * sw + px) * 4;
          temp[idx] = rr / count;
          temp[idx + 1] = gg / count;
          temp[idx + 2] = bb / count;
        }
      }

      const result = new ImageData(temp, sw, sh);
      ctx.putImageData(result, sx, sy);
    }
  };

  const { saveToHistory } = useSaveHistory();

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${originalName}-edited.png`;
    a.click();
    saveToHistory(originalImage, dataUrl, ['Creative Edit']);
  };

  const reset = () => {
    drawBaseImage();
  };

  const MODES: { id: EditMode; label: string; icon: React.ReactNode }[] = [
    { id: 'blur', label: 'Blur Brush', icon: <Paintbrush className="h-3.5 w-3.5" /> },
    { id: 'erase', label: 'Eraser', icon: <Eraser className="h-3.5 w-3.5" /> },
    { id: 'sticker', label: 'Stickers', icon: <Smile className="h-3.5 w-3.5" /> },
  ];

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
          <Paintbrush className="h-4 w-4 text-fuchsia-400" />
          <span className="font-display text-sm font-bold text-foreground">Creative Edit</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {originalImage && (
            <>
              <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button onClick={download} className="flex items-center gap-1.5 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-400 hover:bg-fuchsia-500/20 transition-all">
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Mode selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tool</span>
            <div className="flex flex-col gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditMode(m.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                    editMode === m.id
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brush size */}
          {editMode !== 'sticker' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Brush Size</Label>
                <span className="text-xs font-mono font-semibold text-foreground">{brushSize}px</span>
              </div>
              <Slider min={5} max={100} step={1} value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} />
            </div>
          )}

          {/* Blur intensity */}
          {editMode === 'blur' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Blur Intensity</Label>
                <span className="text-xs font-mono font-semibold text-foreground">{blurIntensity}</span>
              </div>
              <Slider min={1} max={30} step={1} value={[blurIntensity]} onValueChange={([v]) => setBlurIntensity(v)} />
            </div>
          )}

          {/* Sticker picker */}
          {editMode === 'sticker' && (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Pick Sticker</Label>
                <div className="grid grid-cols-6 gap-1.5">
                  {STICKERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSticker(s)}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all',
                        selectedSticker === s
                          ? 'border-fuchsia-500/50 bg-fuchsia-500/10 scale-110'
                          : 'border-surface-border bg-surface-elevated hover:scale-105'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Sticker Size</Label>
                  <span className="text-xs font-mono font-semibold text-foreground">{stickerSize}px</span>
                </div>
                <Slider min={16} max={120} step={2} value={[stickerSize]} onValueChange={([v]) => setStickerSize(v)} />
              </div>
            </>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto flex items-center justify-center">
          {!originalImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex w-full h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging ? 'border-fuchsia-500/50 bg-fuchsia-500/5' : 'border-surface-border hover:border-fuchsia-500/30 hover:bg-surface-elevated'
              )}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">🎨</div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to edit</p>
              <p className="mt-1 text-sm text-muted-foreground">Blur, Erase & add Stickers</p>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-h-[70vh] max-w-full object-contain rounded-xl border border-surface-border cursor-crosshair"
                style={{ imageRendering: 'auto' }}
              />
              <canvas ref={overlayCanvasRef} className="hidden" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
