import { normalizePairedImagePolygon } from "@/features/scene/lib/coordinates";
import { calculateBBox, getBBoxCenter } from "@/features/scene/lib/geometry";
import type {
  AihubRawAnnotationFile,
  AihubRawPolygonAnnotation,
} from "@/features/scene/types/aihub-annotation";
import type {
  ChangeType,
  DisplayPriority,
  NormalizedSceneData,
  SceneObject,
  ShapeType,
  UpdateType,
} from "@/features/scene/types/scene";

const changeTypeMap = {
  0: "new",
  1: "removed",
  2: "updated",
} as const;

const shapeTypeMap = {
  0: "complete",
  1: "partial",
} as const;

const updateTypeMap = {
  0: "floor_change",
  1: "steel_frame_completed",
  2: "structure_added",
  3: "roof_color_changed",
  4: "outline_changed",
} as const;

const visualHeightByChangeType: Record<ChangeType, number> = {
  new: 6,
  removed: 1,
  updated: 3,
};

function getMappedValue<T extends string>(
  map: Record<number, T>,
  value: number,
  fieldName: string,
): T {
  const mappedValue = map[value];

  if (!mappedValue) {
    throw new Error(`Unknown ${fieldName} value: ${value}`);
  }

  return mappedValue;
}

export function mapChangeType(value: number): ChangeType {
  return getMappedValue(changeTypeMap, value, "polygon.shift");
}

export function mapShapeType(value: number): ShapeType {
  return getMappedValue(shapeTypeMap, value, "polygon.shape");
}

export function mapUpdateTypes(
  annotation: AihubRawPolygonAnnotation,
): UpdateType[] {
  const rawUpdate = annotation["polygon.updates"] ?? annotation["polygon.update"];
  const updateValues = Array.isArray(rawUpdate)
    ? rawUpdate
    : rawUpdate === undefined
      ? []
      : [rawUpdate];

  return updateValues.map((value) =>
    getMappedValue(updateTypeMap, value, "polygon.update"),
  );
}

export function getDisplayPriority(
  changeType: ChangeType,
  updateTypes: UpdateType[],
): DisplayPriority {
  if (changeType === "new" || changeType === "removed") {
    return "high";
  }

  if (
    updateTypes.length === 1 &&
    updateTypes[0] === "roof_color_changed"
  ) {
    return "low";
  }

  return "medium";
}

export function getVisualHeight(changeType: ChangeType): number {
  return visualHeightByChangeType[changeType];
}

function mapSceneObject(
  annotation: AihubRawPolygonAnnotation,
  sourceImageWidth: number,
  sourceImageHeight: number,
): SceneObject {
  const normalizedPolygon = normalizePairedImagePolygon(
    annotation["polygon.points"],
    sourceImageWidth,
    sourceImageHeight,
  );
  const bbox = calculateBBox(normalizedPolygon.points);
  const changeType = mapChangeType(annotation["polygon.shift"]);
  const updateTypes = mapUpdateTypes(annotation);

  return {
    id: annotation["polygon.id"],
    name: annotation["polygon.name"],
    sourcePanel: normalizedPolygon.sourcePanel,
    polygon: normalizedPolygon.points,
    bbox,
    center: getBBoxCenter(bbox),
    changeType,
    updateTypes,
    shapeType: mapShapeType(annotation["polygon.shape"]),
    displayPriority: getDisplayPriority(changeType, updateTypes),
    visualHeight: getVisualHeight(changeType),
  };
}

export function normalizeSceneAnnotation(
  rawScene: AihubRawAnnotationFile,
): NormalizedSceneData {
  const sourceImageWidth = rawScene.images["images.width"];
  const imageHeight = rawScene.images["images.height"];

  return {
    imageId: rawScene.images["images.id"],
    sourceImageWidth,
    imageWidth: sourceImageWidth / 2,
    imageHeight,
    category: rawScene.info["info.category"],
    objects: rawScene.annotations.map((annotation) =>
      mapSceneObject(annotation, sourceImageWidth, imageHeight),
    ),
  };
}
