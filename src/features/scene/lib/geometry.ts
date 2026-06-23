import type { BBox, Point2D } from "@/features/scene/types/scene";

export function calculateBBox(points: Point2D[]): BBox {
  if (points.length === 0) {
    throw new Error("Cannot calculate a bounding box from an empty polygon.");
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getBBoxCenter(bbox: BBox): Point2D {
  return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
}

type ClipBoundary = {
  isInside: (point: Point2D) => boolean;
  getIntersection: (start: Point2D, end: Point2D) => Point2D;
};

function clipAgainstBoundary(
  points: Point2D[],
  boundary: ClipBoundary,
): Point2D[] {
  if (points.length === 0) {
    return [];
  }

  const clipped: Point2D[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    const currentInside = boundary.isInside(current);
    const previousInside = boundary.isInside(previous);

    if (currentInside) {
      if (!previousInside) {
        clipped.push(boundary.getIntersection(previous, current));
      }
      clipped.push(current);
    } else if (previousInside) {
      clipped.push(boundary.getIntersection(previous, current));
    }
  }

  return clipped;
}

function intersectVertical(
  start: Point2D,
  end: Point2D,
  boundaryX: number,
): Point2D {
  const deltaX = end[0] - start[0];
  const ratio = deltaX === 0 ? 0 : (boundaryX - start[0]) / deltaX;

  return [boundaryX, start[1] + ratio * (end[1] - start[1])];
}

function intersectHorizontal(
  start: Point2D,
  end: Point2D,
  boundaryY: number,
): Point2D {
  const deltaY = end[1] - start[1];
  const ratio = deltaY === 0 ? 0 : (boundaryY - start[1]) / deltaY;

  return [start[0] + ratio * (end[0] - start[0]), boundaryY];
}

export function clipPolygonToBBox(points: Point2D[], bbox: BBox): Point2D[] {
  const minX = bbox.x;
  const maxX = bbox.x + bbox.width;
  const minY = bbox.y;
  const maxY = bbox.y + bbox.height;

  const boundaries: ClipBoundary[] = [
    {
      isInside: ([x]) => x >= minX,
      getIntersection: (start, end) => intersectVertical(start, end, minX),
    },
    {
      isInside: ([x]) => x <= maxX,
      getIntersection: (start, end) => intersectVertical(start, end, maxX),
    },
    {
      isInside: ([, y]) => y >= minY,
      getIntersection: (start, end) => intersectHorizontal(start, end, minY),
    },
    {
      isInside: ([, y]) => y <= maxY,
      getIntersection: (start, end) => intersectHorizontal(start, end, maxY),
    },
  ];

  return boundaries.reduce(
    (clipped, boundary) => clipAgainstBoundary(clipped, boundary),
    points,
  );
}
