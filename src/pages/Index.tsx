import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { ImageUploader } from '@/components/ImageUploader';
import { ImagePreview } from '@/components/ImagePreview';
import { ToolsSidebar } from '@/components/ToolsSidebar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { ProcessingParams } from '@/types/imageProcessing';
import {
  Eye,
  SlidersHorizontal,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RightPanel = 'history' | null;

export default function Index() {
  const processor = useImageProcessor();
  const navigate = useNavigate();
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParamsChange = (p: Partial<ProcessingParams>) => {
    // params are applied live via onApplyFilter in ToolsSidebar
  };

  const hasImage = !!processor.originalImage;
  const canUndo = processor.historyIndex > 0 || processor.history.length > 0;
  const canRedo = processor.historyIndex < processor.history.length - 1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top navigation bar */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-border bg-surface px-4 z-10">
        {/* Logo + back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-glow-sm">
              <Eye className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-gradient-brand">VisionPro</span>
              <span className="ml-1.5 text-xs text-muted-foreground hidden sm:inline">Filters Studio</span>
            </div>
          </div>
        </div>

        {/* Center status */}
        <div className="hidden md:flex items-center gap-3">
          {hasImage && (
            <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Image loaded
            </span>
          )}
          {processor.isProcessing && (
            <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
              <span className="h-3 w-3 rounded-full border border-primary border-t-transparent animate-spin-slow" />
              Processing…
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {hasImage && (
            <button
              onClick={processor.resetToOriginal}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              showUpload
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-primary/40'
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            {hasImage ? 'New Image' : 'Upload'}
          </button>
          <button
            onClick={() => setRightPanel(rightPanel === 'history' ? null : 'history')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
              rightPanel === 'history'
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-primary/40'
            )}
          >
            <History className="h-3.5 w-3.5" />
            History
            {processor.history.length > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {processor.history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Upload overlay banner */}
      {(showUpload || !hasImage) && (
        <div className={cn(
          'flex-shrink-0 border-b border-surface-border bg-background p-4 transition-all',
          hasImage ? 'shadow-studio-md' : ''
        )}>
          <ImageUploader
            onUpload={(file) => {
              processor.uploadImage(file);
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — tools */}
        <aside
          className={cn(
            'flex flex-shrink-0 flex-col border-r border-surface-border bg-sidebar transition-all duration-300 relative',
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'
          )}
        >
          <ToolsSidebar
            activeFilter={processor.activeFilter}
            activeParams={processor.activeParams}
            disabled={!hasImage}
            onApplyFilter={processor.applyFilter}
            onParamsChange={handleParamsChange}
          />
        </aside>

        {/* Sidebar collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'flex-shrink-0 flex h-8 w-5 items-center justify-center border-r border-t border-b border-surface-border bg-surface text-muted-foreground hover:text-primary hover:border-primary/40 transition-all',
            sidebarCollapsed ? 'rounded-r-md' : 'rounded-r-md'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Center — image preview */}
        <main className="flex flex-1 flex-col overflow-hidden p-4">
          {hasImage ? (
            <ImagePreview
              originalImage={processor.originalImage}
              processedImage={processor.processedImage}
              isProcessing={processor.isProcessing}
              processingTime={processor.processingTime}
              onDownload={processor.downloadImage}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center space-y-4">
                <div className="mx-auto h-24 w-24 rounded-2xl gradient-brand flex items-center justify-center shadow-glow animate-pulse-glow">
                  <SlidersHorizontal className="h-10 w-10 text-primary-foreground" />
                </div>
                <h1 className="font-display text-3xl font-bold">
                  <span className="text-gradient-brand">VisionPro</span>
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Advanced image processing in your browser. Upload an image to apply filters, adjustments, and effects — no server required.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Grayscale', 'Edge Detection', 'Cartoon', 'Blur', 'Sharpen', 'Pixelate'].map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right panel — history */}
        {rightPanel === 'history' && (
          <aside className="flex w-56 flex-shrink-0 flex-col border-l border-surface-border bg-sidebar">
            <HistoryPanel
              history={processor.history}
              historyIndex={processor.historyIndex}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={processor.undo}
              onRedo={processor.redo}
            />
          </aside>
        )}
      </div>

      {/* Bottom status bar */}
      <footer className="flex h-7 flex-shrink-0 items-center justify-between border-t border-surface-border bg-surface px-4 text-[11px] text-muted-foreground/60">
        <span>VisionPro Studio · Canvas-powered processing</span>
        <span className="font-mono">
          {processor.history.length} operation{processor.history.length !== 1 ? 's' : ''} · Active: {processor.activeFilter}
        </span>
      </footer>
    </div>
  );
}
