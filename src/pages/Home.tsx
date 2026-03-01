import { useNavigate } from 'react-router-dom';
import { Layers, Minimize2, FileSymlink, Crop, ArrowRight, Sparkles, RotateCw, Eraser } from 'lucide-react';

const features = [
  {
    icon: Layers,
    emoji: '🎨',
    title: 'Image Filters',
    description: 'Apply professional filters: grayscale, blur, edge detection, cartoon, brightness/contrast, sharpen, emboss and more.',
    path: '/studio',
    badge: '13 filters',
  },
  {
    icon: Sparkles,
    emoji: '✨',
    title: 'Enhance & Clarity',
    description: 'Sharpen details, reduce noise, auto contrast, and fix dark/low-light photos. Natural colors preserved.',
    path: '/enhance',
    badge: '4 enhancements',
  },
  {
    icon: Minimize2,
    emoji: '⚡',
    title: 'Compress & Resize',
    description: 'Reduce file size in KB/MB while preserving quality. Control output size precisely with quality sliders.',
    path: '/compress',
    badge: 'Lossy & lossless',
  },
  {
    icon: FileSymlink,
    emoji: '🔄',
    title: 'Convert Format',
    description: 'Convert between PNG, JPEG, WebP, BMP. Batch convert multiple files at once, instantly in the browser.',
    path: '/convert',
    badge: 'JPEG · PNG · WebP',
  },
  {
    icon: Crop,
    emoji: '✂️',
    title: 'Crop & Adjust',
    description: 'Crop to exact dimensions, drag edge handles to resize, or use preset aspect ratios like 16:9, 1:1, 4:3.',
    path: '/crop',
    badge: 'Drag edges',
  },
  {
    icon: RotateCw,
    emoji: '🔃',
    title: 'Rotate & Straighten',
    description: 'Rotate by any angle, flip horizontally or vertically, and use quick presets for 90°, 180°, 270°.',
    path: '/rotate',
    badge: 'Any angle',
  },
  {
    icon: Eraser,
    emoji: '🪄',
    title: 'Remove Background',
    description: 'Select and remove image backgrounds with pointer. Paint areas to remove. Outputs transparent PNG.',
    path: '/remove-bg',
    badge: 'Pointer select',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      {/* Feature cards only */}
      <section className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <button
              key={f.path}
              onClick={() => navigate(f.path)}
              className="group relative text-left rounded-2xl border border-surface-border bg-surface p-6 transition-all duration-300 hover:shadow-studio-md hover:border-primary/50 hover:-translate-y-0.5 overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-border bg-surface-elevated text-2xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                    {f.emoji}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-elevated px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                    {f.badge}
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {f.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0">
                  Open tool <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro Studio · All processing done client-side via Canvas API
      </footer>
    </div>
  );
}
