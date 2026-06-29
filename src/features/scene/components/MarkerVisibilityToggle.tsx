"use client";

import { cn } from "@/lib/utils";

type MarkerVisibilityToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function MarkerVisibilityToggle({
  checked,
  onCheckedChange,
  disabled = false,
}: MarkerVisibilityToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="font-medium">Marker</span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors",
          checked
            ? "border-white/50 bg-white/25"
            : "border-white/20 bg-transparent",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full bg-slate-300 transition-transform",
            checked && "translate-x-4 bg-white",
          )}
        />
      </span>
    </button>
  );
}
