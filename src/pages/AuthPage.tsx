import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Mail, Lock, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      } else {
        navigate('/dashboard');
      }
    } else {
      if (!name.trim()) {
        toast({ title: 'Name required', description: 'Please enter your name.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'We sent a verification link to your email.' });
      }
    }
    setLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail('demo@adaptiveiq.app');
    setPassword('demo123456');
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-glow">
            <Brain className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient-brand">AdaptiveIQ</h1>
          <p className="text-muted-foreground text-sm">{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-studio-lg backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg gradient-brand py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Info className="h-3.5 w-3.5" />
              Demo Login
            </div>
            <p className="text-[10px] text-muted-foreground">
              Can't access your email? Use demo credentials to try the app.
            </p>
            <button type="button" onClick={fillDemoCredentials}
              className="w-full rounded-md border border-primary/30 bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
