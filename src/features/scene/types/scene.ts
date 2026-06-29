export type Point2D = [number, number];
export type WorldPoint = [number, number, number];

export type ChangeType = "new" | "removed" | "updated";

export type UpdateType =
  | "floor_change"
  | "steel_frame_completed"
  | "structure_added"
  | "roof_color_changed"
  | "outline_changed";

export type ShapeType = "complete" | "partial";
export type DisplayPriority = "high" | "medium" | "low";
export type AnnotationSourcePanel = "before" | "after"; // annotation 원본 좌표의 출처를 기록하기 위해 필요한 타입
export type VisualizationMode = "polygon" | "bbox" | "both" | "extrusion";

export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RawPolygonAnnotation = {
  "polygon.id": string;
  "polygon.name": string;
  "polygon.points": Point2D[];
  "polygon.shape": number;
  "polygon.shift": number;
  "polygon.update"?: number | number[];
  "polygon.updates"?: number[];
  "polygon.address"?: string;
};

export type RawSceneAnnotation = {
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
  annotations: RawPolygonAnnotation[];
};

export type SceneObject = {
  id: string;
  name: string;
  sourcePanel: AnnotationSourcePanel;
  polygon: Point2D[];
  bbox: BBox;
  center: Point2D;
  changeType: ChangeType;
  updateTypes: UpdateType[];
  shapeType: ShapeType;
  address: string | null;
  displayPriority: DisplayPriority;
  visualHeight: number;
};

export type NormalizedSceneData = {
  imageId: string;
  sourceImageWidth: number;
  imageWidth: number;
  imageHeight: number;
  category: number;
  objects: SceneObject[];
};
