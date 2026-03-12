import { useState, useRef } from 'react';
import { useSaveHistory } from '@/hooks/useSaveHistory';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileSymlink, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string; desc: string }[] = [
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg', desc: 'Best for photos, smaller size' },
  { value: 'image/png', label: 'PNG', ext: 'png', desc: 'Lossless, supports transparency' },
  { value: 'image/webp', label: 'WebP', ext: 'webp', desc: 'Modern format, great compression' },
  { value: 'image/bmp', label: 'BMP', ext: 'bmp', desc: 'Uncompressed bitmap' },
];

function getExt(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

export default function ConvertPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<{ name: string; original: string; converted: string | null; originalExt: string }[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertImage = (dataUrl: string, fmt: OutputFormat): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        // Fill white background for JPEG/BMP (no transparency)
        if (fmt === 'image/jpeg' || fmt === 'image/bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL(fmt, 0.92));
      };
      img.src = dataUrl;
    });

  const handleFiles = async (fileList: FileList) => {
    const accepted = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    const results = await Promise.all(
      accepted.map(
        (f) =>
          new Promise<{ name: string; original: string; converted: string | null; originalExt: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const url = e.target?.result as string;
              const converted = await convertImage(url, outputFormat);
              resolve({ name: f.name, original: url, converted, originalExt: getExt(f.name) });
            };
            reader.readAsDataURL(f);
          })
      )
    );
    setFiles((prev) => [...prev, ...results]);
  };

  const reconvert = async (fmt: OutputFormat) => {
    const updated = await Promise.all(
      files.map(async (f) => ({
        ...f,
        converted: await convertImage(f.original, fmt),
      }))
    );
    setFiles(updated);
  };

  const { saveToHistory } = useSaveHistory();

  const download = (file: typeof files[0]) => {
    if (!file.converted) return;
    const ext = FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext ?? 'jpg';
    const a = document.createElement('a');
    a.href = file.converted;
    a.download = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    a.click();
    saveToHistory(file.original, file.converted, [`Convert to ${ext.toUpperCase()}`]);
  };

  const downloadAll = () => files.forEach(download);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
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
          <FileSymlink className="h-4 w-4 text-cyan-400" />
          <span className="font-display text-sm font-bold text-foreground">Format Converter</span>
        </div>
        {files.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setFiles([])}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear all
            </button>
            <button
              onClick={downloadAll}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Download all
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-surface-border bg-sidebar p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Convert to</p>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setOutputFormat(f.value);
                    reconvert(f.value);
                  }}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 transition-all',
                    outputFormat === f.value
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-surface-border bg-surface-elevated hover:border-surface-border/80'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-bold font-mono',
                      outputFormat === f.value ? 'text-cyan-400' : 'text-foreground'
                    )}>
                      .{f.ext}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{f.label}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-elevated p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Supported inputs</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['JPG', 'PNG', 'WebP', 'BMP', 'GIF', 'TIFF', 'AVIF'].map((f) => (
                <span key={f} className="rounded border border-surface-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 cursor-pointer transition-all mb-6',
              isDragging
                ? 'border-cyan-500/50 bg-cyan-500/5'
                : 'border-surface-border hover:border-cyan-500/30 hover:bg-surface-elevated'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface-elevated text-2xl mb-3">
              🔄
            </div>
            <p className="font-semibold text-foreground">Drop images here to convert</p>
            <p className="mt-1 text-xs text-muted-foreground">Supports multiple files · Click to browse</p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {files.length} file{files.length !== 1 ? 's' : ''} converted
              </p>
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface p-3">
                  <img
                    src={file.converted ?? file.original}
                    alt={file.name}
                    className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border border-surface-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded border border-surface-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        .{file.originalExt}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                        .{FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => download(file)}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-all flex-shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Save
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
