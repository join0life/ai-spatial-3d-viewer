"use client";

import type { ImagePeriod } from "@/features/scene/types/scene";
import { cn } from "@/lib/utils";
import { useId } from "react";

type ImagePeriodSegmentedControlProps = {
  value: ImagePeriod;
  onValueChange: (value: ImagePeriod) => void;
  className?: string;
  disabled?: boolean;
};

const IMAGE_PERIOD_OPTIONS = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
] as const satisfies ReadonlyArray<{
  value: ImagePeriod;
  label: string;
}>;

export function ImagePeriodSegmentedControl({
  value,
  onValueChange,
  className,
  disabled = false,
}: ImagePeriodSegmentedControlProps) {
  const groupName = useId();

  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "flex w-fit rounded-lg border border-white/15 bg-gray-950/60 p-1",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <legend className="sr-only">항공영상 시점</legend>
      {IMAGE_PERIOD_OPTIONS.map((option) => (
        <label
          key={option.value}
          className={cn(
            "relative cursor-pointer",
            disabled && "cursor-not-allowed",
          )}
        >
          <input
            type="radio"
            name={groupName}
            value={option.value}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex min-w-20 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors",
              "hover:text-white peer-checked:bg-white/15 peer-checked:text-white",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-white/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-950",
            )}
          >
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
