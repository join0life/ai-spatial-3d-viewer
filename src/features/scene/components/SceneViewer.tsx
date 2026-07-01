"use client";

import { ObjectDetailPanel } from "@/features/scene/components/ObjectDetailPanel";
import { SceneViewerControls } from "@/features/scene/components/SceneViewerControls";
import { useSceneViewer } from "@/features/scene/hooks/useSceneViewer";
import type { SceneId } from "@/features/scene/lib/scenes";
import type {
  ImagePeriod,
  VisualizationMode,
} from "@/features/scene/types/scene";
import { useRef, useState } from "react";

type SceneViewerProps = {
  sceneId: SceneId;
};

export default function SceneViewer({ sceneId }: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imagePeriod, setImagePeriod] = useState<ImagePeriod>("after");
  const [visualizationMode, setVisualizationMode] =
    useState<VisualizationMode>("both");
  const [showMarker, setShowMarker] = useState(true);
  const selectedObject = useSceneViewer({
    containerRef,
    sceneId,
    imagePeriod,
    visualizationMode,
    showMarker,
  });

  return (
    <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-900">
      <SceneViewerControls
        imagePeriod={imagePeriod}
        onImagePeriodChange={setImagePeriod}
        visualizationMode={visualizationMode}
        onVisualizationModeChange={setVisualizationMode}
        showMarker={showMarker}
        onShowMarkerChange={setShowMarker}
      />
      <ObjectDetailPanel
        object={selectedObject}
        className="absolute bottom-4 right-4 z-10 w-[min(22rem,calc(100%-2rem))]"
      />
      <div ref={containerRef} className="h-full min-h-0 w-full min-w-0" />
    </section>
  );
}
