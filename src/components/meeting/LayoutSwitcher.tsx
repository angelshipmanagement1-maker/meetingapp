import { Grid3x3, LayoutGrid, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type LayoutMode = "grid" | "spotlight" | "sidebar";

interface LayoutSwitcherProps {
  currentLayout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
}

export function LayoutSwitcher({ currentLayout, onLayoutChange }: LayoutSwitcherProps) {
  const layouts = [
    { mode: "grid" as LayoutMode, icon: Grid3x3, label: "Grid View", description: "Equal size tiles" },
    { mode: "spotlight" as LayoutMode, icon: Maximize2, label: "Spotlight", description: "Focus on speaker" },
    { mode: "sidebar" as LayoutMode, icon: LayoutGrid, label: "Sidebar", description: "Main + thumbnails" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="glass" size="icon" className="h-12 w-12 rounded-full">
          <Grid3x3 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass w-64 border-border" align="center" side="top">
        <div className="space-y-1">
          <p className="mb-2 text-sm font-semibold">Layout</p>
          {layouts.map((layout) => {
            const Icon = layout.icon;
            return (
              <Button
                key={layout.mode}
                variant={currentLayout === layout.mode ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onLayoutChange(layout.mode)}
              >
                <Icon className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">{layout.label}</div>
                  <div className="text-xs text-muted-foreground">{layout.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
