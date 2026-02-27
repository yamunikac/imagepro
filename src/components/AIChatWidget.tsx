import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Msg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = (errData as any)?.error || 'Something went wrong';
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch { break; }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Failed to connect to AI assistant.' }]);
    }

    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-studio-lg transition-all duration-300',
          open
            ? 'bg-surface-elevated border border-surface-border text-muted-foreground rotate-90'
            : 'gradient-brand text-primary-foreground shadow-glow hover:scale-105'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-surface-border bg-surface shadow-studio-lg animate-fade-in-up flex flex-col overflow-hidden" style={{ maxHeight: '70vh' }}>
          <div className="flex items-center gap-2 border-b border-surface-border bg-surface-elevated px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">AdaptiveIQ AI</p>
              <p className="text-[10px] text-muted-foreground">Assessment assistant</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ minHeight: '200px', maxHeight: '50vh' }}>
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Bot className="h-10 w-10 mx-auto text-primary/30" />
                <p className="text-sm text-muted-foreground">Hi! How can I help with your assessment?</p>
                <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                  {['How does adaptive testing work?', 'Tips to improve', 'Explain my results'].map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      className="rounded-full border border-surface-border bg-surface-elevated px-2.5 py-1 text-[10px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
                <div className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px]',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface-elevated border border-surface-border text-muted-foreground'
                )}>
                  {m.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <div className={cn(
                  'rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[75%]',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface-elevated border border-surface-border text-foreground'
                )}>
                  <span className="whitespace-pre-wrap">{m.content}</span>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-elevated border border-surface-border">
                  <Bot className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="rounded-xl bg-surface-elevated border border-surface-border px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-surface-border bg-surface-elevated p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about assessments..."
                className="flex-1 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors" />
              <button type="submit" disabled={isLoading || !input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-primary-foreground disabled:opacity-50 transition-opacity">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
