"use client";

import type { SceneId } from "@/features/scene/lib/scenes";
import * as THREE from "three";
import { useEffect, useRef } from "react";

type SceneViewerProps = {
  sceneId: SceneId;
};

const SCENE_BACKGROUND_COLOR = "#111827";
const SCENE_OBJECT_COLOR = "#90EE90";

export default function SceneViewer({ sceneId }: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: SCENE_OBJECT_COLOR,
    });
    const cube = new THREE.Mesh(boxGeometry, material);

    scene.add(cube);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

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

    let animationFrameId = 0;

    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      boxGeometry.dispose();
      material.dispose();
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
