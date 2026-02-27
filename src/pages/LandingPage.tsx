import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, ArrowRight, Sparkles, User, BarChart3, Target, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleTheme, theme } = useTheme();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      <section className="relative flex flex-col items-center justify-center py-24 px-6 text-center overflow-hidden flex-1">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative space-y-8 max-w-2xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            <span className="text-foreground">Adaptive</span>
            <br />
            <span className="text-gradient-brand">IQ Assessment</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            An intelligent assessment platform that adapts to your skill level in real-time. 
            Powered by weighted scoring and confidence-based difficulty adjustment.
          </p>

          {/* Theme toggle */}
          <div className="flex justify-center">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
            >
              <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Target, label: 'Adaptive Engine', sub: 'Real-time difficulty' },
              { icon: BarChart3, label: 'Deep Analytics', sub: 'Topic-wise insights' },
              { icon: Zap, label: 'Instant Reports', sub: 'Competency profile' },
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
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-4 w-4" />
                Go to Dashboard
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
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                >
                  <Brain className="h-4 w-4" />
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        AdaptiveIQ · Intelligent Adaptive Assessment Platform
      </footer>
    </div>
  );
}
