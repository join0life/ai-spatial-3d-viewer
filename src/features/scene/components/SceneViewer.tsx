"use client";

import type { SceneId } from "@/features/scene/lib/scenes";
import * as THREE from "three";
import { useEffect, useRef } from "react";

type SceneViewerProps = {
  sceneId: SceneId;
};

const SCENE_BACKGROUND_COLOR = "#111827";

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
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    let animationFrameId = 0;

    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  void sceneId;

  return <div ref={containerRef} className="min-h-0 flex-1 bg-slate-900" />;
}
