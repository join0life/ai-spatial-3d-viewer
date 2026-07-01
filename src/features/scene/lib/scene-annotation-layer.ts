import {
  VIEWER_ANNOTATION,
  VIEWER_EXTRUSION,
  VIEWER_INTERACTION,
  VIEWER_MARKER,
  VIEWER_PLANE,
} from "@/features/scene/constants/viewer";
import {
  bboxToWorld,
  imageToWorld,
  polygonToWorld,
} from "@/features/scene/lib/coordinates";
import {
  applyVisualizationMode,
  createExtrusionMesh,
  createLineLoop,
  createPolygonHitMesh,
  disposeLineLoopGroup,
  disposeMeshGroup,
} from "@/features/scene/lib/viewer-helpers";
import type {
  NormalizedSceneData,
  VisualizationMode,
} from "@/features/scene/types/scene";
import * as THREE from "three";

export type SceneAnnotationLayerResources = {
  markerGeometry: THREE.SphereGeometry;
  markerMaterial: THREE.MeshBasicMaterial;
  polygonMaterial: THREE.LineBasicMaterial;
  bboxMaterial: THREE.LineBasicMaterial;
  selectionMaterial: THREE.LineBasicMaterial;
  extrusionMaterial: THREE.MeshBasicMaterial;
  selectedExtrusionMaterial: THREE.MeshBasicMaterial;
  hitAreaMaterial: THREE.MeshBasicMaterial;
  markerGroup: THREE.Group;
  polygonGroup: THREE.Group;
  bboxGroup: THREE.Group;
  extrusionGroup: THREE.Group;
  polygonHitAreaGroup: THREE.Group;
  bboxHitAreaGroup: THREE.Group;
  selectedPolygonGroup: THREE.Group;
  selectedBBoxGroup: THREE.Group;
  selectedExtrusionGroup: THREE.Group;
};

export function createSceneAnnotationLayerResources(
  visualizationMode: VisualizationMode,
  showMarker: boolean,
): SceneAnnotationLayerResources {
  const markerGeometry = new THREE.SphereGeometry(VIEWER_MARKER.radius, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: VIEWER_MARKER.color,
  });
  const polygonMaterial = new THREE.LineBasicMaterial({
    color: VIEWER_ANNOTATION.polygonColor,
  });
  const bboxMaterial = new THREE.LineBasicMaterial({
    color: VIEWER_ANNOTATION.bboxColor,
  });
  const selectionMaterial = new THREE.LineBasicMaterial({
    color: VIEWER_INTERACTION.highlightColor,
  });
  const extrusionMaterial = new THREE.MeshBasicMaterial({
    color: VIEWER_EXTRUSION.color,
    opacity: VIEWER_EXTRUSION.opacity,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const selectedExtrusionMaterial = new THREE.MeshBasicMaterial({
    color: VIEWER_INTERACTION.highlightColor,
    wireframe: true,
  });
  const hitAreaMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const layers = {
    markerGeometry,
    markerMaterial,
    polygonMaterial,
    bboxMaterial,
    selectionMaterial,
    extrusionMaterial,
    selectedExtrusionMaterial,
    hitAreaMaterial,
    markerGroup: new THREE.Group(),
    polygonGroup: new THREE.Group(),
    bboxGroup: new THREE.Group(),
    extrusionGroup: new THREE.Group(),
    polygonHitAreaGroup: new THREE.Group(),
    bboxHitAreaGroup: new THREE.Group(),
    selectedPolygonGroup: new THREE.Group(),
    selectedBBoxGroup: new THREE.Group(),
    selectedExtrusionGroup: new THREE.Group(),
  };

  layers.markerGroup.visible = showMarker;
  applyVisualizationMode(
    visualizationMode,
    layers.polygonGroup,
    layers.bboxGroup,
    layers.extrusionGroup,
  );
  applyVisualizationMode(
    visualizationMode,
    layers.selectedPolygonGroup,
    layers.selectedBBoxGroup,
    layers.selectedExtrusionGroup,
  );

  return layers;
}

export function addSceneAnnotationLayerGroups(
  scene: THREE.Scene,
  layers: SceneAnnotationLayerResources,
) {
  scene.add(layers.markerGroup);
  scene.add(layers.polygonGroup, layers.bboxGroup);
  scene.add(layers.extrusionGroup);
  scene.add(layers.polygonHitAreaGroup, layers.bboxHitAreaGroup);
  scene.add(
    layers.selectedPolygonGroup,
    layers.selectedBBoxGroup,
    layers.selectedExtrusionGroup,
  );
}

export function renderSceneObjects(
  data: NormalizedSceneData,
  layers: SceneAnnotationLayerResources,
) {
  data.objects.forEach((object) => {
    const [x, y, z] = imageToWorld(
      object.center[0],
      object.center[1],
      data.imageWidth,
      data.imageHeight,
      VIEWER_PLANE.width,
      VIEWER_PLANE.depth,
      VIEWER_MARKER.radius,
    );
    const marker = new THREE.Mesh(layers.markerGeometry, layers.markerMaterial);
    marker.position.set(x, y, z);
    marker.userData.sceneObjectId = object.id;
    layers.markerGroup.add(marker);

    const worldPolygon = polygonToWorld(
      object.polygon,
      data.imageWidth,
      data.imageHeight,
      VIEWER_PLANE.width,
      VIEWER_PLANE.depth,
      VIEWER_ANNOTATION.polygonYOffset,
    );
    const polygonLine = createLineLoop(worldPolygon, layers.polygonMaterial);
    polygonLine.userData.sceneObjectId = object.id;
    layers.polygonGroup.add(polygonLine);
    const polygonHitArea = createPolygonHitMesh(
      worldPolygon,
      layers.hitAreaMaterial,
    );
    polygonHitArea.userData.sceneObjectId = object.id;
    layers.polygonHitAreaGroup.add(polygonHitArea);

    const extrusion = createExtrusionMesh(
      worldPolygon,
      object.visualHeight * VIEWER_EXTRUSION.heightScale,
      layers.extrusionMaterial,
    );
    extrusion.userData.sceneObjectId = object.id;
    layers.extrusionGroup.add(extrusion);

    const worldBBox = bboxToWorld(
      object.bbox,
      data.imageWidth,
      data.imageHeight,
      VIEWER_PLANE.width,
      VIEWER_PLANE.depth,
      VIEWER_ANNOTATION.bboxYOffset,
    );
    const bboxLine = createLineLoop(worldBBox, layers.bboxMaterial);
    bboxLine.userData.sceneObjectId = object.id;
    layers.bboxGroup.add(bboxLine);
    const bboxHitArea = createPolygonHitMesh(worldBBox, layers.hitAreaMaterial);
    bboxHitArea.userData.sceneObjectId = object.id;
    layers.bboxHitAreaGroup.add(bboxHitArea);
  });
}

export function disposeSceneAnnotationLayerResources(
  layers: SceneAnnotationLayerResources,
) {
  layers.markerGeometry.dispose();
  layers.markerMaterial.dispose();
  disposeLineLoopGroup(layers.polygonGroup);
  disposeLineLoopGroup(layers.bboxGroup);
  disposeMeshGroup(layers.extrusionGroup);
  disposeMeshGroup(layers.polygonHitAreaGroup);
  disposeMeshGroup(layers.bboxHitAreaGroup);
  disposeLineLoopGroup(layers.selectedPolygonGroup);
  disposeLineLoopGroup(layers.selectedBBoxGroup);
  disposeMeshGroup(layers.selectedExtrusionGroup);
  layers.polygonMaterial.dispose();
  layers.bboxMaterial.dispose();
  layers.selectionMaterial.dispose();
  layers.extrusionMaterial.dispose();
  layers.selectedExtrusionMaterial.dispose();
  layers.hitAreaMaterial.dispose();
}
