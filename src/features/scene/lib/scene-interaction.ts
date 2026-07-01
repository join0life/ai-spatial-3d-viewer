import {
  VIEWER_ANNOTATION,
  VIEWER_EXTRUSION,
  VIEWER_INTERACTION,
  VIEWER_PLANE,
} from "@/features/scene/constants/viewer";
import type { SceneAnnotationLayerResources } from "@/features/scene/lib/scene-annotation-layer";
import { bboxToWorld, polygonToWorld } from "@/features/scene/lib/coordinates";
import {
  createExtrusionMesh,
  createLineLoop,
  disposeLineLoopGroup,
  disposeMeshGroup,
} from "@/features/scene/lib/viewer-helpers";
import type {
  NormalizedSceneData,
  SceneObject,
  VisualizationMode,
} from "@/features/scene/types/scene";
import * as THREE from "three";

type FindClickedSceneObjectParams = {
  event: PointerEvent;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  layers: SceneAnnotationLayerResources;
  data: NormalizedSceneData;
  visualizationMode: VisualizationMode;
};

export function findClickedSceneObject({
  event,
  renderer,
  camera,
  raycaster,
  pointer,
  layers,
  data,
  visualizationMode,
}: FindClickedSceneObjectParams): SceneObject | null {
  const canvasBounds = renderer.domElement.getBoundingClientRect();

  if (canvasBounds.width === 0 || canvasBounds.height === 0) {
    return null;
  }

  pointer.set(
    ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1,
    -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);

  const clickTargets = [
    ...(visualizationMode === "polygon" || visualizationMode === "both"
      ? layers.polygonHitAreaGroup.children
      : []),
    ...(visualizationMode === "bbox" || visualizationMode === "both"
      ? layers.bboxHitAreaGroup.children
      : []),
    ...(visualizationMode === "extrusion" ? layers.extrusionGroup.children : []),
  ];
  const [intersection] = raycaster.intersectObjects(clickTargets, false);
  const selectedObjectId = intersection?.object.userData.sceneObjectId;

  if (typeof selectedObjectId !== "string") {
    return null;
  }

  return data.objects.find((object) => object.id === selectedObjectId) ?? null;
}

export function clearSelectionHighlight(
  layers: SceneAnnotationLayerResources,
) {
  disposeLineLoopGroup(layers.selectedPolygonGroup);
  disposeLineLoopGroup(layers.selectedBBoxGroup);
  disposeMeshGroup(layers.selectedExtrusionGroup);
  layers.selectedPolygonGroup.clear();
  layers.selectedBBoxGroup.clear();
  layers.selectedExtrusionGroup.clear();
}

export function renderSelectionHighlight(
  object: SceneObject,
  data: NormalizedSceneData,
  layers: SceneAnnotationLayerResources,
) {
  clearSelectionHighlight(layers);

  const selectedWorldPolygon = polygonToWorld(
    object.polygon,
    data.imageWidth,
    data.imageHeight,
    VIEWER_PLANE.width,
    VIEWER_PLANE.depth,
    VIEWER_ANNOTATION.polygonYOffset + VIEWER_INTERACTION.highlightYOffset,
  );
  layers.selectedPolygonGroup.add(
    createLineLoop(selectedWorldPolygon, layers.selectionMaterial),
  );

  const selectedWorldBBox = bboxToWorld(
    object.bbox,
    data.imageWidth,
    data.imageHeight,
    VIEWER_PLANE.width,
    VIEWER_PLANE.depth,
    VIEWER_ANNOTATION.bboxYOffset + VIEWER_INTERACTION.highlightYOffset,
  );
  layers.selectedBBoxGroup.add(
    createLineLoop(selectedWorldBBox, layers.selectionMaterial),
  );

  layers.selectedExtrusionGroup.add(
    createExtrusionMesh(
      selectedWorldPolygon,
      object.visualHeight * VIEWER_EXTRUSION.heightScale,
      layers.selectedExtrusionMaterial,
    ),
  );
}
