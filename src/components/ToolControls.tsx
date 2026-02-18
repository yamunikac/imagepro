import { FilterType, ProcessingParams } from '@/types/imageProcessing';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ToolControlsProps {
  filter: FilterType;
  params: ProcessingParams;
  onParamsChange: (params: Partial<ProcessingParams>) => void;
}

export function ToolControls({ filter, params, onParamsChange }: ToolControlsProps) {
  if (filter === 'blur') {
    return (
      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Radius</Label>
          <span className="text-sm font-mono text-primary font-semibold">{params.blurRadius ?? 3}</span>
        </div>
        <Slider
          min={1}
          max={15}
          step={1}
          value={[params.blurRadius ?? 3]}
          onValueChange={([v]) => onParamsChange({ blurRadius: v })}
          className="w-full"
        />
      </div>
    );
  }

  if (filter === 'brightness-contrast') {
    return (
      <div className="space-y-4 px-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Brightness</Label>
            <span className="text-sm font-mono text-primary font-semibold">{params.brightness ?? 0}</span>
          </div>
          <Slider
            min={-100}
            max={100}
            step={1}
            value={[params.brightness ?? 0]}
            onValueChange={([v]) => onParamsChange({ brightness: v })}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contrast</Label>
            <span className="text-sm font-mono text-primary font-semibold">{params.contrast ?? 0}</span>
          </div>
          <Slider
            min={-100}
            max={100}
            step={1}
            value={[params.contrast ?? 0]}
            onValueChange={([v]) => onParamsChange({ contrast: v })}
          />
        </div>
      </div>
    );
  }

  if (filter === 'rotate') {
    return (
      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Angle</Label>
          <span className="text-sm font-mono text-primary font-semibold">{params.rotateAngle ?? 0}°</span>
        </div>
        <Slider
          min={-180}
          max={180}
          step={1}
          value={[params.rotateAngle ?? 0]}
          onValueChange={([v]) => onParamsChange({ rotateAngle: v })}
        />
        <div className="flex gap-2 mt-1">
          {[-90, 0, 90, 180].map((a) => (
            <button
              key={a}
              onClick={() => onParamsChange({ rotateAngle: a })}
              className="flex-1 rounded-md border border-surface-border bg-surface-elevated px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {a}°
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (filter === 'resize') {
    return (
      <div className="space-y-3 px-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Width</Label>
            <Input
              type="number"
              value={params.resizeWidth ?? 800}
              onChange={(e) => onParamsChange({ resizeWidth: Number(e.target.value) })}
              className="h-8 bg-surface-elevated border-surface-border text-sm font-mono"
              min={10}
              max={8000}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Height</Label>
            <Input
              type="number"
              value={params.resizeHeight ?? 600}
              onChange={(e) => onParamsChange({ resizeHeight: Number(e.target.value) })}
              className="h-8 bg-surface-elevated border-surface-border text-sm font-mono"
              min={10}
              max={8000}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={params.keepAspectRatio ?? true}
            onCheckedChange={(v) => onParamsChange({ keepAspectRatio: v })}
            id="aspect-ratio"
          />
          <Label htmlFor="aspect-ratio" className="text-xs text-muted-foreground cursor-pointer">
            Lock aspect ratio
          </Label>
        </div>
      </div>
    );
  }

  if (filter === 'pixelate') {
    return (
      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Block Size</Label>
          <span className="text-sm font-mono text-primary font-semibold">{params.pixelateSize ?? 10}px</span>
        </div>
        <Slider
          min={2}
          max={40}
          step={1}
          value={[params.pixelateSize ?? 10]}
          onValueChange={([v]) => onParamsChange({ pixelateSize: v })}
        />
      </div>
    );
  }

  return null;
}
