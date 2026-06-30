"use client";

import {
  VIEWER_ANNOTATION,
  VIEWER_EXTRUSION,
  VIEWER_INTERACTION,
  VIEWER_MARKER,
  VIEWER_PLANE,
  VIEWER_SCENE,
} from "@/features/scene/constants/viewer";
import { ObjectDetailPanel } from "@/features/scene/components/ObjectDetailPanel";
import { SceneViewerControls } from "@/features/scene/components/SceneViewerControls";
import { normalizeSceneAnnotation } from "@/features/scene/lib/annotation-mappers";
import {
  bboxToWorld,
  imageToWorld,
  polygonToWorld,
} from "@/features/scene/lib/coordinates";
import { getSceneById, type SceneId } from "@/features/scene/lib/scenes";
import {
  applyVisualizationMode,
  createExtrusionMesh,
  createLineLoop,
  createPolygonHitMesh,
  disposeLineLoopGroup,
  disposeMeshGroup,
} from "@/features/scene/lib/viewer-helpers";
import type {
  ImagePeriod,
  NormalizedSceneData,
  RawSceneAnnotation,
  SceneObject,
  VisualizationMode,
} from "@/features/scene/types/scene";
import * as THREE from "three";
import { TIFFLoader } from "three/addons/loaders/TIFFLoader.js";
import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type SceneViewerProps = {
  sceneId: SceneId;
};

type SelectedSceneObject = {
  sceneId: SceneId;
  object: SceneObject;
} | null;

type ImagePeriodTextures = Partial<
  Record<ImagePeriod, THREE.DataTexture>
>;

export default function SceneViewer({ sceneId }: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const imagePeriodTexturesRef = useRef<ImagePeriodTextures>({});
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const polygonGroupRef = useRef<THREE.Group | null>(null);
  const bboxGroupRef = useRef<THREE.Group | null>(null);
  const extrusionGroupRef = useRef<THREE.Group | null>(null);
  const selectedPolygonGroupRef = useRef<THREE.Group | null>(null);
  const selectedBBoxGroupRef = useRef<THREE.Group | null>(null);
  const selectedExtrusionGroupRef = useRef<THREE.Group | null>(null);
  const visualizationModeRef = useRef<VisualizationMode>("both");
  const imagePeriodRef = useRef<ImagePeriod>("after");
  const showMarkerRef = useRef(true);
  const [imagePeriod, setImagePeriod] = useState<ImagePeriod>("after");
  const [visualizationMode, setVisualizationMode] =
    useState<VisualizationMode>("both");
  const [showMarker, setShowMarker] = useState(true);
  const [selectedSceneObject, setSelectedSceneObject] =
    useState<SelectedSceneObject>(null);

  const selectedObject =
    selectedSceneObject?.sceneId === sceneId
      ? selectedSceneObject.object
      : null;

  useEffect(() => {
    imagePeriodRef.current = imagePeriod;

    const planeMaterial = planeMaterialRef.current;
    const texture = imagePeriodTexturesRef.current[imagePeriod];

    if (planeMaterial && texture) {
      planeMaterial.map = texture;
      planeMaterial.color.set(VIEWER_PLANE.materialColor);
      planeMaterial.needsUpdate = true;
    }
  }, [imagePeriod]);

  useEffect(() => {
    visualizationModeRef.current = visualizationMode;
    applyVisualizationMode(
      visualizationMode,
      polygonGroupRef.current,
      bboxGroupRef.current,
      extrusionGroupRef.current,
    );
    applyVisualizationMode(
      visualizationMode,
      selectedPolygonGroupRef.current,
      selectedBBoxGroupRef.current,
      selectedExtrusionGroupRef.current,
    );
  }, [visualizationMode]);

  useEffect(() => {
    showMarkerRef.current = showMarker;

    if (markerGroupRef.current) {
      markerGroupRef.current.visible = showMarker;
    }
  }, [showMarker]);

  useEffect(() => {
    const container = containerRef.current;
    const sceneItem = getSceneById(sceneId);

    if (!container || !sceneItem) {
      return;
    }

    let disposed = false;
    const imagePeriodTextures: ImagePeriodTextures = {};
    let annotationData: NormalizedSceneData | null = null;
    const annotationRequest = new AbortController();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VIEWER_SCENE.backgroundColor);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 8, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

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

    const textureLoader = new TIFFLoader();
    const loadImagePeriodTexture = (period: ImagePeriod, path: string) => {
      textureLoader.load(
        path,
        (loadedTexture) => {
          if (disposed) {
            loadedTexture.dispose();
            return;
          }

          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          imagePeriodTextures[period] = loadedTexture;

          if (imagePeriodRef.current === period) {
            planeMaterial.map = loadedTexture;
            planeMaterial.color.set(VIEWER_PLANE.materialColor);
            planeMaterial.needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          if (!disposed) {
            console.error(`Failed to load ${period} TIFF: ${path}`, error);
          }
        },
      );
    };

    loadImagePeriodTexture("after", sceneItem.afterImagePath);
    loadImagePeriodTexture("before", sceneItem.beforeImagePath);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    const markerGeometry = new THREE.SphereGeometry(
      VIEWER_MARKER.radius,
      16,
      16,
    );
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: VIEWER_MARKER.color,
    });
    const markerGroup = new THREE.Group();
    markerGroup.visible = showMarkerRef.current;
    markerGroupRef.current = markerGroup;
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
    const polygonGroup = new THREE.Group();
    const bboxGroup = new THREE.Group();
    const extrusionGroup = new THREE.Group();
    const polygonHitAreaGroup = new THREE.Group();
    const bboxHitAreaGroup = new THREE.Group();
    const selectedPolygonGroup = new THREE.Group();
    const selectedBBoxGroup = new THREE.Group();
    const selectedExtrusionGroup = new THREE.Group();
    polygonGroupRef.current = polygonGroup;
    bboxGroupRef.current = bboxGroup;
    extrusionGroupRef.current = extrusionGroup;
    selectedPolygonGroupRef.current = selectedPolygonGroup;
    selectedBBoxGroupRef.current = selectedBBoxGroup;
    selectedExtrusionGroupRef.current = selectedExtrusionGroup;
    applyVisualizationMode(
      visualizationModeRef.current,
      polygonGroup,
      bboxGroup,
      extrusionGroup,
    );
    applyVisualizationMode(
      visualizationModeRef.current,
      selectedPolygonGroup,
      selectedBBoxGroup,
      selectedExtrusionGroup,
    );
    scene.add(markerGroup);
    scene.add(polygonGroup, bboxGroup);
    scene.add(extrusionGroup);
    scene.add(polygonHitAreaGroup, bboxHitAreaGroup);
    scene.add(
      selectedPolygonGroup,
      selectedBBoxGroup,
      selectedExtrusionGroup,
    );

    const clearSelectionHighlight = () => {
      disposeLineLoopGroup(selectedPolygonGroup);
      disposeLineLoopGroup(selectedBBoxGroup);
      disposeMeshGroup(selectedExtrusionGroup);
      selectedPolygonGroup.clear();
      selectedBBoxGroup.clear();
      selectedExtrusionGroup.clear();
    };

    const renderSelectionHighlight = (
      object: SceneObject,
      data: NormalizedSceneData,
    ) => {
      clearSelectionHighlight();

      const selectedWorldPolygon = polygonToWorld(
        object.polygon,
        data.imageWidth,
        data.imageHeight,
        VIEWER_PLANE.width,
        VIEWER_PLANE.depth,
        VIEWER_ANNOTATION.polygonYOffset +
          VIEWER_INTERACTION.highlightYOffset,
      );
      selectedPolygonGroup.add(
        createLineLoop(selectedWorldPolygon, selectionMaterial),
      );

      const selectedWorldBBox = bboxToWorld(
        object.bbox,
        data.imageWidth,
        data.imageHeight,
        VIEWER_PLANE.width,
        VIEWER_PLANE.depth,
        VIEWER_ANNOTATION.bboxYOffset + VIEWER_INTERACTION.highlightYOffset,
      );
      selectedBBoxGroup.add(
        createLineLoop(selectedWorldBBox, selectionMaterial),
      );

      selectedExtrusionGroup.add(
        createExtrusionMesh(
          selectedWorldPolygon,
          object.visualHeight * VIEWER_EXTRUSION.heightScale,
          selectedExtrusionMaterial,
        ),
      );
    };

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

      const canvasBounds = renderer.domElement.getBoundingClientRect();

      if (canvasBounds.width === 0 || canvasBounds.height === 0) {
        return;
      }

      pointer.set(
        ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1,
        -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);

      const mode = visualizationModeRef.current;
      const clickTargets = [
        ...(mode === "polygon" || mode === "both"
          ? polygonHitAreaGroup.children
          : []),
        ...(mode === "bbox" || mode === "both"
          ? bboxHitAreaGroup.children
          : []),
        ...(mode === "extrusion" ? extrusionGroup.children : []),
      ];
      const [intersection] = raycaster.intersectObjects(clickTargets, false);
      const selectedObjectId = intersection?.object.userData.sceneObjectId;
      const object =
        typeof selectedObjectId === "string"
          ? currentAnnotationData.objects.find(
              (item) => item.id === selectedObjectId,
            )
          : undefined;

      if (!object) {
        clearSelectionHighlight();
        setSelectedSceneObject(null);
        return;
      }

      renderSelectionHighlight(object, currentAnnotationData);
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

        normalizedAnnotationData.objects.forEach((object) => {
          const [x, y, z] = imageToWorld(
            object.center[0],
            object.center[1],
            normalizedAnnotationData.imageWidth,
            normalizedAnnotationData.imageHeight,
            VIEWER_PLANE.width,
            VIEWER_PLANE.depth,
            VIEWER_MARKER.radius,
          );
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(x, y, z);
          marker.userData.sceneObjectId = object.id;
          markerGroup.add(marker);

          const worldPolygon = polygonToWorld(
            object.polygon,
            normalizedAnnotationData.imageWidth,
            normalizedAnnotationData.imageHeight,
            VIEWER_PLANE.width,
            VIEWER_PLANE.depth,
            VIEWER_ANNOTATION.polygonYOffset,
          );
          const polygonLine = createLineLoop(worldPolygon, polygonMaterial);
          polygonLine.userData.sceneObjectId = object.id;
          polygonGroup.add(polygonLine);
          const polygonHitArea = createPolygonHitMesh(
            worldPolygon,
            hitAreaMaterial,
          );
          polygonHitArea.userData.sceneObjectId = object.id;
          polygonHitAreaGroup.add(polygonHitArea);

          const extrusion = createExtrusionMesh(
            worldPolygon,
            object.visualHeight * VIEWER_EXTRUSION.heightScale,
            extrusionMaterial,
          );
          extrusion.userData.sceneObjectId = object.id;
          extrusionGroup.add(extrusion);

          const worldBBox = bboxToWorld(
            object.bbox,
            normalizedAnnotationData.imageWidth,
            normalizedAnnotationData.imageHeight,
            VIEWER_PLANE.width,
            VIEWER_PLANE.depth,
            VIEWER_ANNOTATION.bboxYOffset,
          );
          const bboxLine = createLineLoop(worldBBox, bboxMaterial);
          bboxLine.userData.sceneObjectId = object.id;
          bboxGroup.add(bboxLine);
          const bboxHitArea = createPolygonHitMesh(
            worldBBox,
            hitAreaMaterial,
          );
          bboxHitArea.userData.sceneObjectId = object.id;
          bboxHitAreaGroup.add(bboxHitArea);
        });
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

    let animationFrameId = 0;

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      disposed = true;
      annotationRequest.abort();
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      planeGeometry.dispose();
      planeMaterial.map = null;
      planeMaterial.dispose();
      Object.values(imagePeriodTextures).forEach((texture) => {
        texture.dispose();
      });
      markerGeometry.dispose();
      markerMaterial.dispose();
      disposeLineLoopGroup(polygonGroup);
      disposeLineLoopGroup(bboxGroup);
      disposeMeshGroup(extrusionGroup);
      disposeMeshGroup(polygonHitAreaGroup);
      disposeMeshGroup(bboxHitAreaGroup);
      clearSelectionHighlight();
      polygonMaterial.dispose();
      bboxMaterial.dispose();
      selectionMaterial.dispose();
      extrusionMaterial.dispose();
      selectedExtrusionMaterial.dispose();
      hitAreaMaterial.dispose();
      markerGroupRef.current = null;
      planeMaterialRef.current = null;
      imagePeriodTexturesRef.current = {};
      polygonGroupRef.current = null;
      bboxGroupRef.current = null;
      extrusionGroupRef.current = null;
      selectedPolygonGroupRef.current = null;
      selectedBBoxGroupRef.current = null;
      selectedExtrusionGroupRef.current = null;
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sceneId]);

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
