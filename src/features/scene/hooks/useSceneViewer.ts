"use client";

import {
  VIEWER_INTERACTION,
  VIEWER_PLANE,
} from "@/features/scene/constants/viewer";
import { normalizeSceneAnnotation } from "@/features/scene/lib/annotation-mappers";
import { getSceneById, type SceneId } from "@/features/scene/lib/scenes";
import {
  addSceneAnnotationLayerGroups,
  createSceneAnnotationLayerResources,
  disposeSceneAnnotationLayerResources,
  renderSceneObjects,
  type SceneAnnotationLayerResources,
} from "@/features/scene/lib/scene-annotation-layer";
import {
  clearSelectionHighlight,
  findClickedSceneObject,
  renderSelectionHighlight,
} from "@/features/scene/lib/scene-interaction";
import { createSceneRenderer } from "@/features/scene/lib/scene-renderer";
import {
  applyImagePeriodTexture,
  disposeSceneTextures,
  loadSceneTextures,
  type ImagePeriodTextures,
} from "@/features/scene/lib/scene-textures";
import { applyVisualizationMode } from "@/features/scene/lib/viewer-helpers";
import type {
  ImagePeriod,
  NormalizedSceneData,
  RawSceneAnnotation,
  SceneObject,
  VisualizationMode,
} from "@/features/scene/types/scene";
import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { TIFFLoader } from "three/addons/loaders/TIFFLoader.js";

type UseSceneViewerParams = {
  containerRef: RefObject<HTMLDivElement | null>;
  sceneId: SceneId;
  imagePeriod: ImagePeriod;
  visualizationMode: VisualizationMode;
  showMarker: boolean;
};

type SelectedSceneObject = {
  sceneId: SceneId;
  object: SceneObject;
} | null;

export function useSceneViewer({
  containerRef,
  sceneId,
  imagePeriod,
  visualizationMode,
  showMarker,
}: UseSceneViewerParams) {
  const planeMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const imagePeriodTexturesRef = useRef<ImagePeriodTextures>({});
  const layersRef = useRef<SceneAnnotationLayerResources | null>(null);
  const visualizationModeRef = useRef<VisualizationMode>("both");
  const imagePeriodRef = useRef<ImagePeriod>("after");
  const showMarkerRef = useRef(true);
  const [selectedSceneObject, setSelectedSceneObject] =
    useState<SelectedSceneObject>(null);

  const selectedObject =
    selectedSceneObject?.sceneId === sceneId
      ? selectedSceneObject.object
      : null;

  useEffect(() => {
    imagePeriodRef.current = imagePeriod;
    applyImagePeriodTexture(
      imagePeriod,
      planeMaterialRef.current,
      imagePeriodTexturesRef.current,
    );
  }, [imagePeriod]);

  useEffect(() => {
    visualizationModeRef.current = visualizationMode;

    const layers = layersRef.current;

    if (!layers) {
      return;
    }

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
  }, [visualizationMode]);

  useEffect(() => {
    showMarkerRef.current = showMarker;

    if (layersRef.current) {
      layersRef.current.markerGroup.visible = showMarker;
    }
  }, [showMarker]);

  useEffect(() => {
    const container = containerRef.current;
    const sceneItem = getSceneById(sceneId);

    if (!container || !sceneItem) {
      return;
    }

    setSelectedSceneObject(null);

    let disposed = false;
    const imagePeriodTextures: ImagePeriodTextures = {};
    let annotationData: NormalizedSceneData | null = null;
    const annotationRequest = new AbortController();

    const sceneRenderer = createSceneRenderer(container);
    const { scene, camera, renderer } = sceneRenderer;

    const planeGeometry = new THREE.PlaneGeometry(
      VIEWER_PLANE.width,
      VIEWER_PLANE.depth,
    );
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: VIEWER_PLANE.color,
    });
    planeMaterialRef.current = planeMaterial;
    imagePeriodTexturesRef.current = imagePeriodTextures;
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    loadSceneTextures({
      imagePaths: {
        before: sceneItem.beforeImagePath,
        after: sceneItem.afterImagePath,
      },
      textureLoader: new TIFFLoader(),
      planeMaterial,
      textures: imagePeriodTextures,
      getCurrentImagePeriod: () => imagePeriodRef.current,
      isDisposed: () => disposed,
    });

    const layers = createSceneAnnotationLayerResources(
      visualizationModeRef.current,
      showMarkerRef.current,
    );
    layersRef.current = layers;
    addSceneAnnotationLayerGroups(scene, layers);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerDownPosition = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownPosition.set(event.clientX, event.clientY);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pointerUpPosition = new THREE.Vector2(event.clientX, event.clientY);

      if (
        pointerDownPosition.distanceTo(pointerUpPosition) >
        VIEWER_INTERACTION.clickMovementThreshold
      ) {
        return;
      }

      const currentAnnotationData = annotationData;

      if (!currentAnnotationData) {
        return;
      }

      const object = findClickedSceneObject({
        event,
        renderer,
        camera,
        raycaster,
        pointer,
        layers,
        data: currentAnnotationData,
        visualizationMode: visualizationModeRef.current,
      });

      if (!object) {
        clearSelectionHighlight(layers);
        setSelectedSceneObject(null);
        return;
      }

      renderSelectionHighlight(object, currentAnnotationData, layers);
      setSelectedSceneObject({ sceneId, object });
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    const loadAnnotation = async () => {
      try {
        const response = await fetch(sceneItem.annotationFile, {
          signal: annotationRequest.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawAnnotation: RawSceneAnnotation = await response.json();
        const normalizedAnnotationData = normalizeSceneAnnotation(rawAnnotation);
        annotationData = normalizedAnnotationData;

        if (disposed) {
          return;
        }

        renderSceneObjects(normalizedAnnotationData, layers);
      } catch (error) {
        if (!annotationRequest.signal.aborted) {
          console.error(
            `Failed to load annotation: ${sceneItem.annotationFile}`,
            error,
          );
        }
      }
    };

    void loadAnnotation();

    sceneRenderer.startAnimation();

    return () => {
      disposed = true;
      annotationRequest.abort();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      planeGeometry.dispose();
      planeMaterial.map = null;
      planeMaterial.dispose();
      disposeSceneTextures(imagePeriodTextures);
      disposeSceneAnnotationLayerResources(layers);
      layersRef.current = null;
      planeMaterialRef.current = null;
      imagePeriodTexturesRef.current = {};
      sceneRenderer.dispose();
    };
  }, [containerRef, sceneId]);

  return selectedObject;
}
