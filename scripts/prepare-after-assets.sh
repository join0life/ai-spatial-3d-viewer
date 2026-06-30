#!/usr/bin/env bash

set -euo pipefail

SOURCE_DIR="${1:-.local/scene-assets/original}"
OUTPUT_DIR="${2:-.local/scene-assets/after}"
CROP_SIZE=754
AFTER_X_OFFSET=754

if ! command -v sips >/dev/null 2>&1; then
  echo "Error: this script requires the macOS 'sips' command." >&2
  exit 1
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Error: source directory '${SOURCE_DIR}' does not exist." >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"

if [[ "$(cd "${SOURCE_DIR}" && pwd)" == "$(cd "${OUTPUT_DIR}" && pwd)" ]]; then
  echo "Error: source and output directories must be different." >&2
  exit 1
fi

shopt -s nullglob nocaseglob
source_files=("${SOURCE_DIR}"/*.tif)

if (( ${#source_files[@]} == 0 )); then
  echo "Error: no TIFF files found in '${SOURCE_DIR}'." >&2
  exit 1
fi

required_width=$((AFTER_X_OFFSET + CROP_SIZE))

for source_file in "${source_files[@]}"; do
  filename="$(basename "${source_file}")"
  scene_id="${filename%.*}"
  output_file="${OUTPUT_DIR}/${scene_id}.tif"

  source_width="$(sips -g pixelWidth "${source_file}" | awk '/pixelWidth/ { print $2 }')"
  source_height="$(sips -g pixelHeight "${source_file}" | awk '/pixelHeight/ { print $2 }')"

  if (( source_width < required_width || source_height < CROP_SIZE )); then
    echo "Error: '${source_file}' is ${source_width}x${source_height}; at least ${required_width}x${CROP_SIZE} is required." >&2
    exit 1
  fi

  # Extract the after panel at x=754..1507 and y=0..753.
  # A subpixel y offset prevents sips from interpreting zero as a centered crop.
  sips \
    --cropToHeightWidth "${CROP_SIZE}" "${CROP_SIZE}" \
    --cropOffset 0.1 "${AFTER_X_OFFSET}" \
    "${source_file}" \
    --out "${output_file}" >/dev/null

  echo "Prepared after image: ${output_file}"
done
