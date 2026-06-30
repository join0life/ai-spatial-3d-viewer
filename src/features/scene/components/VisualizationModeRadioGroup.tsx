"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VisualizationMode } from "@/features/scene/types/scene";
import { cn } from "@/lib/utils";
import { useId } from "react";

type VisualizationModeOption = {
  value: VisualizationMode;
  label: string;
  description: string;
};

type VisualizationModeRadioGroupProps = {
  value: VisualizationMode;
  onValueChange: (value: VisualizationMode) => void;
  className?: string;
  disabled?: boolean;
};

const VISUALIZATION_MODE_OPTIONS: VisualizationModeOption[] = [
  {
    value: "polygon",
    label: "Polygon",
    description: "변화 구역의 외곽선을 표시합니다.",
  },
  {
    value: "bbox",
    label: "BBox",
    description: "변화 구역을 감싸는 사각형을 표시합니다.",
  },
  {
    value: "both",
    label: "Polygon/BBox",
    description: "Polygon과 BBox를 함께 표시합니다.",
  },
  {
    value: "extrusion",
    label: "Extrusion",
    description:
      "신축 6, 갱신 3, 소멸 1의 상대값으로 돌출합니다. 실제 높이나 중요도를 의미하지 않습니다.",
  },
];

export function VisualizationModeRadioGroup({
  value,
  onValueChange,
  className,
  disabled = false,
}: VisualizationModeRadioGroupProps) {
  const groupId = useId();

  return (
    <RadioGroup
      value={value}
      onValueChange={(nextValue) => {
        if (isVisualizationMode(nextValue)) {
          onValueChange(nextValue);
        }
      }}
      className={cn("flex flex-row flex-wrap gap-2", className)}
      disabled={disabled}
      aria-label="Visualization mode"
    >
      {VISUALIZATION_MODE_OPTIONS.map((option) => {
        const itemId = `${groupId}-${option.value}`;

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger
              render={
                <label
                  htmlFor={itemId}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-slate-200 transition-colors",
                    "min-w-0 flex-1 justify-center sm:flex-none",
                    "hover:border-white/30 hover:bg-white/5 hover:text-white",
                    "has-[[data-checked]]:border-white/40 has-[[data-checked]]:bg-white/15 has-[[data-checked]]:text-white",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                />
              }
            >
              <RadioGroupItem
                id={itemId}
                value={option.value}
                className="border-white/40 text-white data-checked:border-white data-checked:bg-white data-checked:text-gray-950"
              />
              <span className="min-w-0 truncate font-medium leading-none">
                {option.label}
              </span>
            </TooltipTrigger>
            <TooltipContent>{option.description}</TooltipContent>
          </Tooltip>
        );
      })}
    </RadioGroup>
  );
}

function isVisualizationMode(value: string): value is VisualizationMode {
  return VISUALIZATION_MODE_OPTIONS.some((option) => option.value === value);
}
