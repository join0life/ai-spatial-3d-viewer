"use client";

import {
  VIEWER_ANNOTATION,
  VIEWER_MARKER,
  VIEWER_PLANE,
  VIEWER_SCENE,
} from "@/features/scene/constants/viewer";
import { normalizeSceneAnnotation } from "@/features/scene/lib/annotation-mappers";
import {
  bboxToWorld,
  imageToWorld,
  polygonToWorld,
} from "@/features/scene/lib/coordinates";
import { getSceneById, type SceneId } from "@/features/scene/lib/scenes";
import {
  applyVisualizationMode,
  createLineLoop,
  disposeLineLoopGroup,
} from "@/features/scene/lib/viewer-helpers";
import { SceneViewerControls } from "@/features/scene/components/SceneViewerControls";
import type { RawSceneAnnotation, VisualizationMode } from "@/features/scene/types/scene";
import * as THREE from "three";
import { TIFFLoader } from "three/addons/loaders/TIFFLoader.js";
import { useEffect, useRef, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type SceneViewerProps = {
  sceneId: SceneId;
};

export default function SceneViewer({ sceneId }: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonGroupRef = useRef<THREE.Group | null>(null);
  const bboxGroupRef = useRef<THREE.Group | null>(null);
  const visualizationModeRef = useRef<VisualizationMode>("both");
  const [visualizationMode, setVisualizationMode] =
    useState<VisualizationMode>("both");

  useEffect(() => {
    visualizationModeRef.current = visualizationMode;
    applyVisualizationMode(
      visualizationMode,
      polygonGroupRef.current,
      bboxGroupRef.current,
    );
  }, [visualizationMode]);

  useEffect(() => {
    const container = containerRef.current;
    const sceneItem = getSceneById(sceneId);

    if (!container || !sceneItem) {
      return;
    }

    let disposed = false;
    let texture: THREE.DataTexture | null = null;
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
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    const textureLoader = new TIFFLoader();
    textureLoader.load(
      sceneItem.imagePath,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }

        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        planeMaterial.map = texture;
        planeMaterial.color.set(VIEWER_PLANE.materialColor);
        planeMaterial.needsUpdate = true;
      },
      undefined,
      (error) => {
        if (!disposed) {
          console.error(`Failed to load TIFF: ${sceneItem.imagePath}`, error);
        }
      },
    );

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
    const polygonMaterial = new THREE.LineBasicMaterial({
      color: VIEWER_ANNOTATION.polygonColor,
    });
    const bboxMaterial = new THREE.LineBasicMaterial({
      color: VIEWER_ANNOTATION.bboxColor,
    });
    const polygonGroup = new THREE.Group();
    const bboxGroup = new THREE.Group();
    polygonGroupRef.current = polygonGroup;
    bboxGroupRef.current = bboxGroup;
    applyVisualizationMode(
      visualizationModeRef.current,
      polygonGroup,
      bboxGroup,
    );
    scene.add(markerGroup);
    scene.add(polygonGroup, bboxGroup);

    const loadAnnotation = async () => {
      try {
        const response = await fetch(sceneItem.annotationFile, {
          signal: annotationRequest.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawAnnotation: RawSceneAnnotation = await response.json();
        const annotationData = normalizeSceneAnnotation(rawAnnotation);

        if (disposed) {
          return;
        }

        annotationData.objects.forEach((object) => {
          const [x, y, z] = imageToWorld(
            object.center[0],
            object.center[1],
            annotationData.imageWidth,
            annotationData.imageHeight,
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
            annotationData.imageWidth,
            annotationData.imageHeight,
            VIEWER_PLANE.width,
            VIEWER_PLANE.depth,
            VIEWER_ANNOTATION.polygonYOffset,
          );
          const polygonLine = createLineLoop(worldPolygon, polygonMaterial);
          polygonLine.userData.sceneObjectId = object.id;
          polygonGroup.add(polygonLine);

          const worldBBox = bboxToWorld(
            object.bbox,
            annotationData.imageWidth,
            annotationData.imageHeight,
            VIEWER_PLANE.width,
            VIEWER_PLANE.depth,
            VIEWER_ANNOTATION.bboxYOffset,
          );
          const bboxLine = createLineLoop(worldBBox, bboxMaterial);
          bboxLine.userData.sceneObjectId = object.id;
          bboxGroup.add(bboxLine);
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
      planeGeometry.dispose();
      planeMaterial.dispose();
      texture?.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      disposeLineLoopGroup(polygonGroup);
      disposeLineLoopGroup(bboxGroup);
      polygonMaterial.dispose();
      bboxMaterial.dispose();
      polygonGroupRef.current = null;
      bboxGroupRef.current = null;
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sceneId]);

  return (
    <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-900">
      <SceneViewerControls
        visualizationMode={visualizationMode}
        onVisualizationModeChange={setVisualizationMode}
      />
      <div ref={containerRef} className="h-full min-h-0 w-full min-w-0" />
    </section>
  );
}
