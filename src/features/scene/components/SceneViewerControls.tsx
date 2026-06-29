"use client";

import { MarkerVisibilityToggle } from "@/features/scene/components/MarkerVisibilityToggle";
import { VisualizationModeRadioGroup } from "@/features/scene/components/VisualizationModeRadioGroup";
import type { VisualizationMode } from "@/features/scene/types/scene";

type SceneViewerControlsProps = {
  visualizationMode: VisualizationMode;
  onVisualizationModeChange: (mode: VisualizationMode) => void;
  showMarker: boolean;
  onShowMarkerChange: (showMarker: boolean) => void;
};

export function SceneViewerControls({
  visualizationMode,
  onVisualizationModeChange,
  showMarker,
  onShowMarkerChange,
}: SceneViewerControlsProps) {
  return (
    <div className="absolute inset-x-3 top-3 z-10 max-w-full rounded-xl border border-white/10 bg-gray-950/80 p-3 shadow-lg backdrop-blur sm:left-auto sm:right-4 sm:top-4 sm:w-fit">
      <p className="mb-3 text-sm font-medium text-white">
        Visualization Mode
      </p>
      <VisualizationModeRadioGroup
        value={visualizationMode}
        onValueChange={onVisualizationModeChange}
        className="text-white"
      />
      <div className="mt-3 border-t border-white/10 pt-3">
        <MarkerVisibilityToggle
          checked={showMarker}
          onCheckedChange={onShowMarkerChange}
        />
      </div>
    </div>
  );
}
