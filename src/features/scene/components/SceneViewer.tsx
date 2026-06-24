"use client";

import type { SceneId } from "@/features/scene/lib/scenes";
import * as THREE from "three";
import { useEffect, useRef } from "react";

type SceneViewerProps = {
  sceneId: SceneId;
};

const SCENE_BACKGROUND_COLOR = "#111827";
const PLANE_COLOR = "#334155";
const PLANE_WIDTH = 12;
const PLANE_DEPTH = 12;

export default function SceneViewer({ sceneId }: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

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

    let animationFrameId = 0;

    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      planeGeometry.dispose();
      planeMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  void sceneId;

  return (
    <div
      ref={containerRef}
      className="min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-900"
    />
  );
}
