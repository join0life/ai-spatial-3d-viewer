import { clipPolygonToBBox } from "@/features/scene/lib/geometry";
import type {
  AnnotationSourcePanel,
  Point2D,
  WorldPoint,
} from "@/features/scene/types/scene";

type NormalizedPolygon = {
  sourcePanel: AnnotationSourcePanel;
  points: Point2D[];
};

export function getPolygonPanel(
  points: Point2D[],
  sourceImageWidth: number,
): AnnotationSourcePanel {
  if (points.length === 0) {
    throw new Error("Cannot determine an image panel from an empty polygon.");
  }

  const panelWidth = sourceImageWidth / 2;
  const averageX =
    points.reduce((sum, [x]) => sum + x, 0) / points.length;

  return averageX < panelWidth ? "before" : "after";
}

export function normalizePairedImagePolygon(
  points: Point2D[],
  sourceImageWidth: number,
  sourceImageHeight: number,
): NormalizedPolygon {
  const panelWidth = sourceImageWidth / 2;
  const sourcePanel = getPolygonPanel(points, sourceImageWidth);
  const xOffset = sourcePanel === "after" ? panelWidth : 0;
  const translatedPoints = points.map<Point2D>(([x, y]) => [
    x - xOffset,
    y,
  ]);
  const clippedPoints = clipPolygonToBBox(translatedPoints, {
    x: 0,
    y: 0,
    width: panelWidth,
    height: sourceImageHeight,
  });

  if (clippedPoints.length < 3) {
    throw new Error("The normalized polygon does not contain enough points.");
  }

  return {
    sourcePanel,
    points: clippedPoints,
  };
}

export function imageToWorld(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  planeWidth: number,
  planeDepth: number,
  yOffset = 0.05,
): WorldPoint {
  return [
    (x / imageWidth - 0.5) * planeWidth,
    yOffset,
    -(y / imageHeight - 0.5) * planeDepth,
  ];
}

export function polygonToWorld(
  points: Point2D[],
  imageWidth: number,
  imageHeight: number,
  planeWidth: number,
  planeDepth: number,
  yOffset = 0.05,
): WorldPoint[] {
  return points.map(([x, y]) =>
    imageToWorld(
      x,
      y,
      imageWidth,
      imageHeight,
      planeWidth,
      planeDepth,
      yOffset,
    ),
  );
}
