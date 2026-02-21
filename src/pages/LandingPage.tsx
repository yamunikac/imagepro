import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, ArrowRight, Zap, Shield, Download, Sparkles, User, Image } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-24 px-6 text-center overflow-hidden flex-1">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative space-y-8 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            All processing in your browser — zero uploads
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            <span className="text-foreground">Smart Image</span>
            <br />
            <span className="text-gradient-brand">Optimizer & Editor</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Professional image processing — filters, compression, format conversion, cropping, rotation, and AI background removal. Fast, private, and powerful.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Zap, label: 'Client-side only', sub: 'No server uploads' },
              { icon: Shield, label: '100% Private', sub: 'Images stay local' },
              { icon: Download, label: 'Instant download', sub: 'One-click save' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            {user ? (
              <button
                onClick={() => navigate('/features')}
                className="flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-4 w-4" />
                Open Features
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
                >
                  <User className="h-4 w-4" />
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/features')}
                  className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                >
                  <Image className="h-4 w-4" />
                  Browse Features
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro · Smart Image Optimizer & Editor · All processing done client-side
      </footer>
    </div>
  );
}
