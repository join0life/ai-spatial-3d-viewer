import type { Point2D } from "@/features/scene/types/scene";

export type AihubRawPolygonAnnotation = {
  "polygon.id": string;
  "polygon.name": string;
  "polygon.points": Point2D[];
  "polygon.shape": number;
  "polygon.shift": number;
  "polygon.update"?: number | number[];
  "polygon.updates"?: number[];
};

export type AihubRawAnnotationFile = {
  info: {
    "info.category": number;
    [key: string]: unknown;
  };
  images: {
    "images.id": string;
    "images.width": number;
    "images.height": number;
    [key: string]: unknown;
  };
  annotations: AihubRawPolygonAnnotation[];
};
