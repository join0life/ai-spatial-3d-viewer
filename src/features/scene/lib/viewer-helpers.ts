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

export function createPolygonHitMesh(
  points: WorldPoint[],
  material: THREE.MeshBasicMaterial,
): THREE.Mesh {
  const outline = points.map(([x, , z]) => new THREE.Vector2(x, z));
  const firstPoint = outline[0];
  const lastPoint = outline.at(-1);

  if (firstPoint && lastPoint && firstPoint.equals(lastPoint)) {
    outline.pop();
  }

  const geometry = new THREE.BufferGeometry();

  if (outline.length >= 3) {
    const y = points[0][1];
    const vertices = outline.map(({ x, y: z }) => new THREE.Vector3(x, y, z));
    const triangles = THREE.ShapeUtils.triangulateShape(outline, []);

    geometry.setFromPoints(vertices);
    geometry.setIndex(triangles.flatMap((triangle) => triangle));
  }

  return new THREE.Mesh(geometry, material);
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

export function disposeMeshGroup(group: THREE.Group) {
  group.children.forEach((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
    }
  });
}
