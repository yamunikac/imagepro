import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import {
  Layers, Sparkles, Minimize2, FileSymlink, Crop, RotateCw, Eraser, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Layers,
    emoji: '🎨',
    title: 'Image Filters',
    description: 'Apply professional filters: grayscale, blur, edge detection, cartoon, brightness/contrast, sharpen, emboss and more.',
    path: '/studio',
    gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    border: 'hover:border-violet-500/50',
    accent: 'text-violet-400',
    badge: '13 filters',
  },
  {
    icon: Sparkles,
    emoji: '✨',
    title: 'Enhance & Clarity',
    description: 'Sharpen details, reduce noise, auto contrast, and fix dark/low-light photos. Natural colors preserved.',
    path: '/enhance',
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
    border: 'hover:border-sky-500/50',
    accent: 'text-sky-400',
    badge: '4 enhancements',
  },
  {
    icon: Minimize2,
    emoji: '⚡',
    title: 'Compress & Resize',
    description: 'Reduce file size in KB/MB while preserving quality. Control output size precisely with quality sliders.',
    path: '/compress',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'hover:border-amber-500/50',
    accent: 'text-amber-400',
    badge: 'Lossy & lossless',
  },
  {
    icon: FileSymlink,
    emoji: '🔄',
    title: 'Convert Format',
    description: 'Convert between PNG, JPEG, WebP, BMP. Batch convert multiple files at once, instantly in the browser.',
    path: '/convert',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    border: 'hover:border-cyan-500/50',
    accent: 'text-cyan-400',
    badge: 'JPEG · PNG · WebP',
  },
  {
    icon: Crop,
    emoji: '✂️',
    title: 'Crop & Adjust',
    description: 'Crop to exact dimensions, free-form select any region, or use preset aspect ratios like 16:9, 1:1, 4:3.',
    path: '/crop',
    gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
    border: 'hover:border-emerald-500/50',
    accent: 'text-emerald-400',
    badge: 'Aspect ratios',
  },
  {
    icon: RotateCw,
    emoji: '🔃',
    title: 'Rotate & Straighten',
    description: 'Rotate by any angle, flip horizontally or vertically, and use quick presets for 90°, 180°, 270°.',
    path: '/rotate',
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    border: 'hover:border-indigo-500/50',
    accent: 'text-indigo-400',
    badge: 'Any angle',
  },
  {
    icon: Eraser,
    emoji: '🪄',
    title: 'Remove Background',
    description: 'AI-powered subject detection removes or blurs backgrounds. Works with people, products, pets — any image.',
    path: '/remove-bg',
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    border: 'hover:border-rose-500/50',
    accent: 'text-rose-400',
    badge: 'AI Powered',
  },
  {
    icon: Layers,
    emoji: '🎛️',
    title: 'Adjust & Tune',
    description: 'Fine-tune brightness, contrast, saturation, exposure, highlights, shadows, color temperature, tone & vignette.',
    path: '/adjust',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    border: 'hover:border-amber-500/50',
    accent: 'text-amber-400',
    badge: '9 controls',
  },
  {
    icon: Crop,
    emoji: '🎨',
    title: 'Creative Edit',
    description: 'Paint blur effects, erase parts of images, and place fun stickers. A freeform creative canvas.',
    path: '/creative-edit',
    gradient: 'from-fuchsia-500/20 via-pink-500/10 to-transparent',
    border: 'hover:border-fuchsia-500/50',
    accent: 'text-fuchsia-400',
    badge: 'Blur · Erase · Stickers',
  },
];

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h1 className="font-display text-4xl font-bold text-foreground">All Features</h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Professional image processing tools — entirely in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <button
                key={f.path}
                onClick={() => navigate(f.path)}
                className={`group relative text-left rounded-2xl border border-surface-border bg-surface p-6 transition-all duration-300 hover:shadow-studio-md ${f.border} hover:-translate-y-0.5 overflow-hidden`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
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
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${f.accent} opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0`}>
                    Open tool <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro Studio · All processing done client-side via Canvas API
      </footer>
    </div>
  );
}
