import { useState } from 'react';
import { FilterType, ProcessingParams, TOOLS, TOOL_CATEGORIES } from '@/types/imageProcessing';
import { ToolControls } from '@/components/ToolControls';
import { cn } from '@/lib/utils';
import { ChevronRight, Cpu } from 'lucide-react';

interface ToolsSidebarProps {
  activeFilter: FilterType;
  activeParams: ProcessingParams;
  disabled: boolean;
  onApplyFilter: (filter: FilterType, params?: ProcessingParams) => void;
  onParamsChange: (params: Partial<ProcessingParams>) => void;
}

export function ToolsSidebar({
  activeFilter,
  activeParams,
  disabled,
  onApplyFilter,
  onParamsChange,
}: ToolsSidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('basic');

  const toggleCategory = (cat: string) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  const activeTool = TOOLS.find((t) => t.id === activeFilter);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
        <Cpu className="h-4 w-4 text-primary" />
        <span className="font-display text-sm font-semibold text-foreground">Processing Tools</span>
      </div>

      {/* Active tool info */}
      {activeTool && activeTool.id !== 'none' && (
        <div className="border-b border-surface-border bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{activeTool.icon}</span>
            <span className="text-sm font-semibold text-primary">{activeTool.label}</span>
          </div>
          {activeTool.hasControls && (
            <ToolControls
              filter={activeFilter}
              params={activeParams}
              onParamsChange={(p) => {
                onParamsChange(p);
                onApplyFilter(activeFilter, { ...activeParams, ...p });
              }}
            />
          )}
        </div>
      )}

      {/* Tool list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {TOOL_CATEGORIES.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat.id);
          const isExpanded = expandedCategory === cat.id;

          return (
            <div key={cat.id}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-surface-elevated transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat.label}
                </span>
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                />
              </button>

              {/* Tools */}
              {isExpanded && (
                <div className="space-y-0.5 px-2 pb-2">
                  {catTools.map((tool) => {
                    const isActive = activeFilter === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => !disabled && onApplyFilter(tool.id)}
                        disabled={disabled}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150',
                          isActive
                            ? 'bg-primary/15 border border-primary/30 text-primary shadow-glow-sm'
                            : 'border border-transparent text-foreground hover:bg-surface-elevated hover:border-surface-border',
                          disabled && 'cursor-not-allowed opacity-40'
                        )}
                      >
                        <span className="text-base leading-none">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-tight">{tool.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                        </div>
                        {isActive && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
