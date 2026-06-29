export const VIEWER_SCENE = {
  backgroundColor: "#111827",
} as const;

export const VIEWER_PLANE = {
  color: "#334155",
  width: 12,
  depth: 12,
  materialColor: "#ffffff",
} as const;

export const VIEWER_MARKER = {
  color: "#ef4444",
  radius: 0.1,
} as const;

export const VIEWER_ANNOTATION = {
  polygonColor: "#f97316",
  bboxColor: "#22d3ee",
  polygonYOffset: 0.04,
  bboxYOffset: 0.06,
} as const;

export const VIEWER_INTERACTION = {
  clickMovementThreshold: 5,
  highlightColor: "#f8fafc",
  highlightYOffset: 0.03,
} as const;
