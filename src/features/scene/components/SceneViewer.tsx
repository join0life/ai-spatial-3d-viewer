"use client";

import { normalizeSceneAnnotation } from "@/features/scene/lib/annotation-mappers";
import {
  bboxToWorld,
  imageToWorld,
  polygonToWorld,
} from "@/features/scene/lib/coordinates";
import { getSceneById, type SceneId } from "@/features/scene/lib/scenes";
import type {
  RawSceneAnnotation,
  WorldPoint,
} from "@/features/scene/types/scene";
import * as THREE from "three";
import { TIFFLoader } from "three/addons/loaders/TIFFLoader.js";
import { useEffect, useRef } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type SceneViewerProps = {
  sceneId: SceneId;
};

const SCENE_BACKGROUND_COLOR = "#111827";
const PLANE_COLOR = "#334155";
const PLANE_WIDTH = 12;
const PLANE_DEPTH = 12;
const MATERIAL_COLOR = "#ffffff";
const MARKER_COLOR = "#ef4444";
const MARKER_RADIUS = 0.1;
const POLYGON_COLOR = "#f97316";
const BBOX_COLOR = "#22d3ee";
const POLYGON_Y_OFFSET = 0.04;
const BBOX_Y_OFFSET = 0.06;

function createLineLoop(
  points: WorldPoint[],
  material: THREE.LineBasicMaterial,
): THREE.LineLoop {
  const vertices = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);

  return new THREE.LineLoop(geometry, material);
}

export default function SceneViewer({ sceneId }: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

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

    const planeGeometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_DEPTH);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: PLANE_COLOR });
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
        planeMaterial.color.set(MATERIAL_COLOR);
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

    const markerGeometry = new THREE.SphereGeometry(MARKER_RADIUS, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: MARKER_COLOR });
    const markerGroup = new THREE.Group();
    const polygonMaterial = new THREE.LineBasicMaterial({
      color: POLYGON_COLOR,
    });
    const bboxMaterial = new THREE.LineBasicMaterial({ color: BBOX_COLOR });
    const polygonGroup = new THREE.Group();
    const bboxGroup = new THREE.Group();
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
            PLANE_WIDTH,
            PLANE_DEPTH,
            MARKER_RADIUS,
          );
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(x, y, z);
          marker.userData.sceneObjectId = object.id;
          markerGroup.add(marker);

          const worldPolygon = polygonToWorld(
            object.polygon,
            annotationData.imageWidth,
            annotationData.imageHeight,
            PLANE_WIDTH,
            PLANE_DEPTH,
            POLYGON_Y_OFFSET,
          );
          const polygonLine = createLineLoop(worldPolygon, polygonMaterial);
          polygonLine.userData.sceneObjectId = object.id;
          polygonGroup.add(polygonLine);

          const worldBBox = bboxToWorld(
            object.bbox,
            annotationData.imageWidth,
            annotationData.imageHeight,
            PLANE_WIDTH,
            PLANE_DEPTH,
            BBOX_Y_OFFSET,
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
      polygonGroup.children.forEach((line) => {
        if (line instanceof THREE.LineLoop) {
          line.geometry.dispose();
        }
      });
      bboxGroup.children.forEach((line) => {
        if (line instanceof THREE.LineLoop) {
          line.geometry.dispose();
        }
      });
      polygonMaterial.dispose();
      bboxMaterial.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sceneId]);

  return (
    <div
      ref={containerRef}
      className="min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-900"
    />
  );
}
