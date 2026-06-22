#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR="${1:-public/images}"
OUTPUT_DIR="${2:-.local/scene-assets}"
SCENE_DIR="${OUTPUT_DIR}/scenes"
THUMBNAIL_DIR="${OUTPUT_DIR}/thumbnails"

CROP_SIZE=754
RIGHT_HALF_OFFSET=754
THUMBNAIL_MAX_SIZE=480

if ! command -v sips >/dev/null 2>&1; then
  echo "Error: this script requires the macOS 'sips' command." >&2
  exit 1
fi

mkdir -p "${SCENE_DIR}" "${THUMBNAIL_DIR}"

shopt -s nullglob
source_files=("${SOURCE_DIR}"/*.tif)

if (( ${#source_files[@]} == 0 )); then
  echo "Error: no TIFF files found in '${SOURCE_DIR}'." >&2
  exit 1
fi

for source_file in "${source_files[@]}"; do
  filename="$(basename "${source_file}")"
  scene_id="${filename%.tif}"
  cropped_tif="${SCENE_DIR}/${filename}"
  thumbnail_png="${THUMBNAIL_DIR}/${scene_id}.png"

  sips \
    --cropToHeightWidth "${CROP_SIZE}" "${CROP_SIZE}" \
    --cropOffset 0 "${RIGHT_HALF_OFFSET}" \
    "${source_file}" \
    --out "${cropped_tif}"

  sips \
    --resampleHeightWidthMax "${THUMBNAIL_MAX_SIZE}" \
    --setProperty format png \
    "${cropped_tif}" \
    --out "${thumbnail_png}"

  echo "Prepared ${scene_id}"
done
