import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import heroBg from '@/assets/hero-bg.jpg';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Full-screen hero */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />

        {/* Glassmorphism card */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-2xl mx-auto animate-fade-in-up">
          <div className="rounded-3xl border border-surface-border/30 bg-surface/10 backdrop-blur-xl p-10 sm:p-14 shadow-studio-lg space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-primary">
              ✨ AI-Powered Processing
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
              AI-Powered Image Editing
              <br />
              <span className="text-gradient-brand">Made Simple</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              Enhance, compress, convert, and transform your images with professional-grade tools — entirely in your browser.
            </p>

            <button
              onClick={() => navigate('/features')}
              className="group rounded-xl gradient-brand px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:shadow-[0_0_30px_hsl(190_100%_50%/0.4)] transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              Get Started
              <span className="inline-block ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
