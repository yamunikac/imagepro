import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import heroBg from '@/assets/hero-bg.jpg';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero with background image */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover brightness-125 contrast-115 saturate-150" />
          <div className="absolute inset-0 bg-background/30 dark:bg-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative space-y-8 max-w-3xl mx-auto py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 dark:bg-primary/5 dark:border-primary/20 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-md">
            ✨ AI-Powered Image Processing
          </div>

          <h1 className="font-display text-6xl sm:text-7xl font-bold leading-[1.1] tracking-tight">
            <span className="text-foreground drop-shadow-sm">Transform Your</span>
            <br />
            <span className="text-gradient-brand">Images Instantly</span>
          </h1>

          <p className="text-foreground/70 dark:text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-xl mx-auto drop-shadow-sm">
            Professional image editing powered by AI. Enhance, compress, convert, and remove backgrounds — all in your browser.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/features')}
              className="rounded-xl gradient-brand px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:shadow-glow transition-all hover:-translate-y-0.5"
            >
              Explore Features
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="rounded-xl border border-surface-border bg-surface/90 backdrop-blur-md px-8 py-3 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-surface-elevated transition-all hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro Studio · All processing done client-side via Canvas API
      </footer>
    </div>
  );
}
