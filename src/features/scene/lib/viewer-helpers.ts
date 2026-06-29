import type { VisualizationMode, WorldPoint } from "@/features/scene/types/scene";
import * as THREE from "three";

export function createLineLoop(
  points: WorldPoint[],
  material: THREE.LineBasicMaterial,
): THREE.LineLoop {
  const vertices = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);

  return new THREE.LineLoop(geometry, material);
}

export function applyVisualizationMode(
  mode: VisualizationMode,
  polygonGroup: THREE.Group | null,
  bboxGroup: THREE.Group | null,
) {
  if (polygonGroup) {
    polygonGroup.visible = mode === "polygon" || mode === "both";
  }

  if (bboxGroup) {
    bboxGroup.visible = mode === "bbox" || mode === "both";
  }
}

export function disposeLineLoopGroup(group: THREE.Group) {
  group.children.forEach((line) => {
    if (line instanceof THREE.LineLoop) {
      line.geometry.dispose();
    }
  });
}
