import { notFound } from "next/navigation";

import SceneViewer from "@/features/scene/components/SceneViewer";
import { getSceneById, SCENES } from "@/features/scene/lib/scenes";

type ScenePageProps = {
  params: Promise<{ sceneId: string }>;
};

export function generateStaticParams() {
  return SCENES.map(({ id }) => ({ sceneId: id }));
}

export default async function ScenePage({ params }: ScenePageProps) {
  const { sceneId } = await params;
  const scene = getSceneById(sceneId);

  if (!scene) {
    notFound();
  }

  return <SceneViewer sceneId={scene.id} />;
}
