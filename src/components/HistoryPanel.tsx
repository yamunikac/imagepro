import { HistoryEntry } from '@/types/imageProcessing';
import { Undo2, Redo2, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryPanelProps {
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryPanel({
  history,
  historyIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: HistoryPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold">History</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border border-surface-border transition-all',
              canUndo
                ? 'hover:border-primary/50 hover:text-primary text-muted-foreground hover:bg-surface-elevated'
                : 'opacity-30 cursor-not-allowed text-muted-foreground'
            )}
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border border-surface-border transition-all',
              canRedo
                ? 'hover:border-primary/50 hover:text-primary text-muted-foreground hover:bg-surface-elevated'
                : 'opacity-30 cursor-not-allowed text-muted-foreground'
            )}
            title="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Trash2 className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/50">No history yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...history].reverse().map((entry, revIdx) => {
              const idx = history.length - 1 - revIdx;
              const isActive = idx === historyIndex;
              const isFuture = idx > historyIndex;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg p-2 transition-all',
                    isActive && 'bg-primary/10 border border-primary/20',
                    isFuture && 'opacity-30',
                    !isActive && !isFuture && 'hover:bg-surface-elevated'
                  )}
                >
                  {/* Mini thumbnail */}
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-surface-border bg-surface-elevated">
                    <img
                      src={entry.imageDataUrl}
                      alt={entry.label}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium capitalize truncate',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {entry.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
