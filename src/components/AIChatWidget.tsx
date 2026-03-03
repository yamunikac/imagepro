import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm your VisionPro AI assistant. I can help you with image processing tips, explain features, and suggest the right tools for your needs. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    let assistantSoFar = '';
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMsgs }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        let errMsg = 'Something went wrong. Please try again.';
        if (resp.status === 429) errMsg = 'Rate limit exceeded. Please wait a moment.';
        if (resp.status === 402) errMsg = 'AI usage limit reached.';
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
        setLoading(false);
        return;
      }

      if (!resp.body) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No response received.' }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && prev.length > newMsgs.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('AI chat error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-glow transition-all',
          open ? 'gradient-brand rotate-0' : 'gradient-brand animate-pulse-glow'
        )}
      >
        {open ? <X className="h-6 w-6 text-primary-foreground" /> : <MessageCircle className="h-6 w-6 text-primary-foreground" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-surface-border bg-surface shadow-studio-lg overflow-hidden animate-fade-in-up"
          style={{ height: '500px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3 bg-surface-elevated">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Powered by AI</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'gradient-brand text-primary-foreground'
                    : 'border border-surface-border bg-surface-elevated text-foreground'
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-elevated px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-surface-border p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about image processing..."
                className="flex-1 rounded-xl border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-primary-foreground disabled:opacity-40 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

