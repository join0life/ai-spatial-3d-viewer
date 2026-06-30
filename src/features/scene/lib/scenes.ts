const BLOB_BASE_URL =
  "https://8vxcsfhrykka1mgr.public.blob.vercel-storage.com";

export const SCENES = [
  {
    id: "2015_EPG_JJG_000024",
    label: "EPG 000024",
    description: "변화 객체 9개 · 754 × 754",
    annotationFile: `${BLOB_BASE_URL}/data/2015_EPG_JJG_000024.tif.json`,
    imagePath: `${BLOB_BASE_URL}/scenes/after/2015_EPG_JJG_000024.tif`,
    thumbnailPath: `${BLOB_BASE_URL}/thumbnails/2015_EPG_JJG_000024.png`,
  },
  {
    id: "2015_EPG_JJG_000025",
    label: "EPG 000025",
    description: "변화 객체 8개 · 754 × 754",
    annotationFile: `${BLOB_BASE_URL}/data/2015_EPG_JJG_000025.tif.json`,
    imagePath: `${BLOB_BASE_URL}/scenes/after/2015_EPG_JJG_000025.tif`,
    thumbnailPath: `${BLOB_BASE_URL}/thumbnails/2015_EPG_JJG_000025.png`,
  },
  {
    id: "2015_EPG_JJG_000192",
    label: "EPG 000192",
    description: "변화 객체 5개 · 754 × 754",
    annotationFile: `${BLOB_BASE_URL}/data/2015_EPG_JJG_000192.tif.json`,
    imagePath: `${BLOB_BASE_URL}/scenes/after/2015_EPG_JJG_000192.tif`,
    thumbnailPath: `${BLOB_BASE_URL}/thumbnails/2015_EPG_JJG_000192.png`,
  },
  {
    id: "2015_EPG_JJG_000202",
    label: "EPG 000202",
    description: "변화 객체 7개 · 754 × 754",
    annotationFile: `${BLOB_BASE_URL}/data/2015_EPG_JJG_000202.tif.json`,
    imagePath: `${BLOB_BASE_URL}/scenes/after/2015_EPG_JJG_000202.tif`,
    thumbnailPath: `${BLOB_BASE_URL}/thumbnails/2015_EPG_JJG_000202.png`,
  },
  {
    id: "2015_YCG_JJG_000063",
    label: "YCG 000063",
    description: "변화 객체 7개 · 754 × 754",
    annotationFile: `${BLOB_BASE_URL}/data/2015_YCG_JJG_000063.tif.json`,
    imagePath: `${BLOB_BASE_URL}/scenes/after/2015_YCG_JJG_000063.tif`,
    thumbnailPath: `${BLOB_BASE_URL}/thumbnails/2015_YCG_JJG_000063.png`,
  },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];
export type SceneCatalogItem = (typeof SCENES)[number];

export const DEFAULT_SCENE_ID: SceneId = "2015_EPG_JJG_000202";

export function getSceneById(sceneId: string): SceneCatalogItem | undefined {
  return SCENES.find((scene) => scene.id === sceneId);
}
