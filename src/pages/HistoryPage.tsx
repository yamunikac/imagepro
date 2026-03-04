import Header from '@/components/Header';
import { useImageHistory } from '@/contexts/ImageHistoryContext';
import { Clock, Download, Trash2, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, removeFromHistory } = useImageHistory();

  const handleDownload = (item: typeof history[0]) => {
    const a = document.createElement('a');
    a.href = item.processedImageUrl;
    a.download = `visionpro-${item.featureName.toLowerCase()}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Processing History</h1>
            <span className="ml-auto text-sm text-muted-foreground">{history.length} items</span>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface p-16 text-center space-y-4">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h2 className="font-display text-xl font-semibold text-foreground">No images processed yet</h2>
              <p className="text-sm text-muted-foreground">Process an image from the Features page and it will appear here.</p>
              <button
                onClick={() => navigate('/features')}
                className="rounded-xl gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
              >
                Start Editing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-surface-border bg-surface overflow-hidden hover:border-primary/30 hover:shadow-studio-md transition-all duration-300"
                >
                  {/* Image preview */}
                  <div className="relative aspect-[4/3] bg-surface-elevated overflow-hidden">
                    <img
                      src={item.processedImageUrl}
                      alt={item.featureName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-primary">
                        {item.featureName}
                      </span>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromHistory(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro Studio · All processing done client-side via Canvas API
      </footer>
    </div>
  );
}
