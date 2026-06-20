"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEFAULT_SCENE_ID } from "@/features/scene/lib/scenes";

type ViewerErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function ViewerError({
  error,
  unstable_retry,
}: ViewerErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-1 items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-destructive">Error</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          장면을 불러오지 못했습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          일시적인 오류가 발생했습니다. 다시 시도하거나 기본 장면으로
          이동해주세요.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            오류 코드: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={unstable_retry}>다시 시도</Button>
          <Button
            variant="outline"
            render={
              <Link href={`/scenes/${DEFAULT_SCENE_ID}`}>
                기본 장면으로 이동
              </Link>
            }
          />
        </div>
      </div>
    </main>
  );
}
