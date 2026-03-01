import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Crop, RefreshCw, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type AspectPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16';

const ASPECT_PRESETS: { label: AspectPreset; ratio: number | null }[] = [
  { label: 'free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '9:16', ratio: 9 / 16 },
];

interface CropRect { x: number; y: number; w: number; h: number }

type DragHandle = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right' | null;

export default function CropPage() {
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image');
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('free');
  const [manualW, setManualW] = useState('');
  const [manualH, setManualH] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<CropRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startSelection = useRef<CropRect | null>(null);

  const HANDLE_SIZE = 8;

  const getHitHandle = (pos: { x: number; y: number }, sel: CropRect): DragHandle => {
    const { x, y, w, h } = sel;
    const hs = HANDLE_SIZE;
    // corners
    if (Math.abs(pos.x - x) < hs && Math.abs(pos.y - y) < hs) return 'tl';
    if (Math.abs(pos.x - (x + w)) < hs && Math.abs(pos.y - y) < hs) return 'tr';
    if (Math.abs(pos.x - x) < hs && Math.abs(pos.y - (y + h)) < hs) return 'bl';
    if (Math.abs(pos.x - (x + w)) < hs && Math.abs(pos.y - (y + h)) < hs) return 'br';
    // edges
    if (Math.abs(pos.y - y) < hs && pos.x > x && pos.x < x + w) return 'top';
    if (Math.abs(pos.y - (y + h)) < hs && pos.x > x && pos.x < x + w) return 'bottom';
    if (Math.abs(pos.x - x) < hs && pos.y > y && pos.y < y + h) return 'left';
    if (Math.abs(pos.x - (x + w)) < hs && pos.y > y && pos.y < y + h) return 'right';
    // inside = move
    if (pos.x > x && pos.x < x + w && pos.y > y && pos.y < y + h) return 'move';
    return null;
  };

  const getCursorForHandle = (handle: DragHandle): string => {
    switch (handle) {
      case 'tl': case 'br': return 'nwse-resize';
      case 'tr': case 'bl': return 'nesw-resize';
      case 'top': case 'bottom': return 'ns-resize';
      case 'left': case 'right': return 'ew-resize';
      case 'move': return 'move';
      default: return 'crosshair';
    }
  };

  const redraw = useCallback((sel: CropRect | null) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (sel && sel.w > 2 && sel.h > 2) {
      // Darken outside
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, sel.y); // top
      ctx.fillRect(0, sel.y, sel.x, sel.h); // left
      ctx.fillRect(sel.x + sel.w, sel.y, canvas.width - sel.x - sel.w, sel.h); // right
      ctx.fillRect(0, sel.y + sel.h, canvas.width, canvas.height - sel.y - sel.h); // bottom
      ctx.restore();

      // Border
      ctx.strokeStyle = 'hsl(217, 91%, 60%)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
      
      // Grid lines
      ctx.strokeStyle = 'hsla(217, 91%, 60%, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sel.x + (sel.w / 3) * i, sel.y);
        ctx.lineTo(sel.x + (sel.w / 3) * i, sel.y + sel.h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sel.x, sel.y + (sel.h / 3) * i);
        ctx.lineTo(sel.x + sel.w, sel.y + (sel.h / 3) * i);
        ctx.stroke();
      }

      // Drag handles (corner + edge midpoints)
      ctx.fillStyle = 'hsl(217, 91%, 60%)';
      const handles = [
        [sel.x, sel.y], [sel.x + sel.w, sel.y],
        [sel.x, sel.y + sel.h], [sel.x + sel.w, sel.y + sel.h],
        [sel.x + sel.w / 2, sel.y], [sel.x + sel.w / 2, sel.y + sel.h],
        [sel.x, sel.y + sel.h / 2], [sel.x + sel.w, sel.y + sel.h / 2],
      ];
      handles.forEach(([hx, hy]) => {
        ctx.fillRect(hx - 4, hy - 4, 8, 8);
      });
    }
  }, []);

  const loadImage = (url: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      setSelection(null);
      redraw(null);
    };
    img.src = url;
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ''));
    setCroppedImage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setOriginalImage(url);
      loadImage(url);
    };
    reader.readAsDataURL(file);
  };

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getAspectRatio = () => ASPECT_PRESETS.find((p) => p.label === aspectPreset)?.ratio ?? null;

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    startPos.current = pos;

    if (selection && selection.w > 2 && selection.h > 2) {
      const handle = getHitHandle(pos, selection);
      if (handle) {
        setDragHandle(handle);
        startSelection.current = { ...selection };
        setIsSelecting(true);
        return;
      }
    }
    // New selection
    setDragHandle(null);
    setIsSelecting(true);
    setSelection(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getCanvasPos(e);

    // Update cursor
    if (!isSelecting && selection && selection.w > 2) {
      const handle = getHitHandle(pos, selection);
      canvas.style.cursor = getCursorForHandle(handle);
    }

    if (!isSelecting || !startPos.current) return;

    const dx = pos.x - startPos.current.x;
    const dy = pos.y - startPos.current.y;

    if (dragHandle && startSelection.current) {
      const s = startSelection.current;
      let newSel = { ...s };

      switch (dragHandle) {
        case 'move':
          newSel.x = Math.max(0, Math.min(canvas.width - s.w, s.x + dx));
          newSel.y = Math.max(0, Math.min(canvas.height - s.h, s.y + dy));
          break;
        case 'tl':
          newSel.x = s.x + dx; newSel.y = s.y + dy;
          newSel.w = s.w - dx; newSel.h = s.h - dy;
          break;
        case 'tr':
          newSel.y = s.y + dy;
          newSel.w = s.w + dx; newSel.h = s.h - dy;
          break;
        case 'bl':
          newSel.x = s.x + dx;
          newSel.w = s.w - dx; newSel.h = s.h + dy;
          break;
        case 'br':
          newSel.w = s.w + dx; newSel.h = s.h + dy;
          break;
        case 'top':
          newSel.y = s.y + dy; newSel.h = s.h - dy;
          break;
        case 'bottom':
          newSel.h = s.h + dy;
          break;
        case 'left':
          newSel.x = s.x + dx; newSel.w = s.w - dx;
          break;
        case 'right':
          newSel.w = s.w + dx;
          break;
      }

      // Clamp
      if (newSel.w < 10) newSel.w = 10;
      if (newSel.h < 10) newSel.h = 10;
      newSel.x = Math.max(0, newSel.x);
      newSel.y = Math.max(0, newSel.y);
      if (newSel.x + newSel.w > canvas.width) newSel.w = canvas.width - newSel.x;
      if (newSel.y + newSel.h > canvas.height) newSel.h = canvas.height - newSel.y;

      setSelection(newSel);
      redraw(newSel);
    } else {
      // New selection drawing
      let w = pos.x - startPos.current.x;
      let h = pos.y - startPos.current.y;
      const ratio = getAspectRatio();
      if (ratio) {
        const absW = Math.abs(w);
        const absH = Math.abs(h);
        const newH = absW / ratio;
        if (absH < newH) h = Math.sign(h || 1) * newH;
        else w = Math.sign(w || 1) * (absH * ratio);
      }
      const x = w < 0 ? startPos.current.x + w : startPos.current.x;
      const y = h < 0 ? startPos.current.y + h : startPos.current.y;
      const newSel = { x, y, w: Math.abs(w), h: Math.abs(h) };
      setSelection(newSel);
      redraw(newSel);
    }
  };

  const onMouseUp = () => {
    setIsSelecting(false);
    setDragHandle(null);
  };

  useEffect(() => {
    if (!isSelecting) redraw(selection);
  }, [isSelecting, selection, redraw]);

  const applyCrop = () => {
    const sel = selection;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!sel || !img || !canvas || sel.w < 2 || sel.h < 2) return;

    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = Math.round(sel.w * scaleX);
    outCanvas.height = Math.round(sel.h * scaleY);
    const ctx = outCanvas.getContext('2d')!;
    ctx.drawImage(
      img,
      sel.x * scaleX, sel.y * scaleY,
      sel.w * scaleX, sel.h * scaleY,
      0, 0, outCanvas.width, outCanvas.height
    );
    setCroppedImage(outCanvas.toDataURL('image/png'));
  };

  const applyManualCrop = () => {
    const w = parseInt(manualW);
    const h = parseInt(manualH);
    const img = imgRef.current;
    if (!w || !h || !img) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    setCroppedImage(canvas.toDataURL('image/png'));
  };

  const download = () => {
    if (!croppedImage) return;
    const a = document.createElement('a');
    a.href = croppedImage;
    a.download = `${originalName}-cropped.png`;
    a.click();
  };

  const reset = () => {
    setSelection(null);
    setCroppedImage(null);
    if (imgRef.current) redraw(null);
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
          <Crop className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold text-foreground">Crop & Adjust</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selection && (
            <button
              onClick={applyCrop}
              className="flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all"
            >
              <Crop className="h-3.5 w-3.5" />
              Apply crop
            </button>
          )}
          {croppedImage && (
            <button
              onClick={download}
              className="flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          )}
          {originalImage && (
            <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <aside className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Aspect Ratio</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {ASPECT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setAspectPreset(p.label)}
                  className={cn(
                    'rounded-lg border py-1.5 text-xs font-semibold transition-all',
                    aspectPreset === p.label
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Manual Dimensions</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Width px</Label>
                <Input type="number" placeholder="e.g. 1280" value={manualW} onChange={(e) => setManualW(e.target.value)} className="h-8 bg-surface-elevated border-surface-border text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Height px</Label>
                <Input type="number" placeholder="e.g. 720" value={manualH} onChange={(e) => setManualH(e.target.value)} className="h-8 bg-surface-elevated border-surface-border text-xs font-mono" />
              </div>
            </div>
            <button
              onClick={applyManualCrop}
              disabled={!originalImage || !manualW || !manualH}
              className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Resize to dimensions
            </button>
          </div>

          {selection && (
            <div className="rounded-xl border border-surface-border bg-surface-elevated p-3 space-y-1.5 text-xs">
              <p className="font-semibold text-foreground">Selection</p>
              <div className="flex justify-between text-muted-foreground">
                <span>X</span><span className="font-mono">{Math.round(selection.x)}px</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Y</span><span className="font-mono">{Math.round(selection.y)}px</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Width</span><span className="font-mono text-primary">{Math.round(selection.w)}px</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Height</span><span className="font-mono text-primary">{Math.round(selection.h)}px</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-surface-border bg-surface-elevated p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">How to crop</p>
            <p>1. Upload an image</p>
            <p>2. Click and drag to select crop area</p>
            <p>3. <strong className="text-foreground">Drag handles</strong> on edges/corners to adjust</p>
            <p>4. Click <strong className="text-foreground">Apply crop</strong></p>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          {!originalImage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer',
                isDragging
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-surface-border hover:border-primary/30 hover:bg-surface-elevated'
              )}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-3xl mb-4">✂️</div>
              <p className="font-display text-lg font-semibold text-foreground">Upload image to crop</p>
              <p className="mt-1 text-sm text-muted-foreground">Drag & drop or click to browse</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div ref={containerRef} className="relative flex items-center justify-center rounded-xl border border-surface-border bg-surface overflow-hidden" style={{ minHeight: '400px', maxHeight: '60vh' }}>
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full"
                  style={{ display: 'block', cursor: 'crosshair' }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                />
              </div>

              {croppedImage && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Cropped Result</p>
                  <div className="flex items-center justify-center rounded-xl border border-primary/20 bg-surface p-4">
                    <img src={croppedImage} alt="Cropped" className="max-h-64 max-w-full object-contain rounded-lg" />
                  </div>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Upload different image
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
