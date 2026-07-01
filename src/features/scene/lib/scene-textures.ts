import { VIEWER_PLANE } from "@/features/scene/constants/viewer";
import type { ImagePeriod } from "@/features/scene/types/scene";
import * as THREE from "three";
import type { TIFFLoader } from "three/addons/loaders/TIFFLoader.js";

export type ImagePeriodTextures = Partial<Record<ImagePeriod, THREE.DataTexture>>;

type LoadSceneTexturesParams = {
  imagePaths: Record<ImagePeriod, string>;
  textureLoader: TIFFLoader;
  planeMaterial: THREE.MeshBasicMaterial;
  textures: ImagePeriodTextures;
  getCurrentImagePeriod: () => ImagePeriod;
  isDisposed: () => boolean;
};

export function applyImagePeriodTexture(
  imagePeriod: ImagePeriod,
  planeMaterial: THREE.MeshBasicMaterial | null,
  textures: ImagePeriodTextures,
) {
  const texture = textures[imagePeriod];

  if (!planeMaterial || !texture) {
    return;
  }

  planeMaterial.map = texture;
  planeMaterial.color.set(VIEWER_PLANE.materialColor);
  planeMaterial.needsUpdate = true;
}

export function loadSceneTextures({
  imagePaths,
  textureLoader,
  planeMaterial,
  textures,
  getCurrentImagePeriod,
  isDisposed,
}: LoadSceneTexturesParams) {
  const loadTexture = (period: ImagePeriod) => {
    const imagePath = imagePaths[period];

    textureLoader.load(
      imagePath,
      (loadedTexture) => {
        if (isDisposed()) {
          loadedTexture.dispose();
          return;
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        textures[period] = loadedTexture;

        if (getCurrentImagePeriod() === period) {
          applyImagePeriodTexture(period, planeMaterial, textures);
        }
      },
      undefined,
      (error) => {
        if (!isDisposed()) {
          console.error(`Failed to load ${period} TIFF: ${imagePath}`, error);
        }
      },
    );
  };

  loadTexture("after");
  loadTexture("before");
}

export function disposeSceneTextures(textures: ImagePeriodTextures) {
  Object.values(textures).forEach((texture) => {
    texture.dispose();
  });
}
