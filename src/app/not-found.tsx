import Link from "next/link";

import { DEFAULT_SCENE_ID } from "@/features/scene/lib/scenes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          요청한 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href={`/scenes/${DEFAULT_SCENE_ID}`}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          기본 장면으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
