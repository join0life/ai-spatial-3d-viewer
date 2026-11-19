const GITHUB_REPOSITORY_URL = "https://github.com/join0life/ai-spatial-3d-viewer";

export default function ServiceSuspendedNotice() {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-background px-4 py-12">
      <section
        aria-labelledby="service-suspended-title"
        className="w-full max-w-lg rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8"
      >
        <p className="text-sm font-semibold text-muted-foreground">Notice</p>
        <h1
          id="service-suspended-title"
          className="mt-2 text-2xl font-bold tracking-tight"
        >
          공개 중단 안내
        </h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            이 프로젝트는 AI허브 &apos;항공영상 도시건물 변화탐지&apos; 샘플
            데이터를 사용했습니다.
          </p>
          <p>
            2026년 11월, AI허브에 직접 문의해 가공한 데이터도 외부 공개가
            제한된다는 답변을 받아 데이터 공개와 배포를 중단했습니다.
          </p>
          <p>코드와 구현 내용은 GitHub에서 확인할 수 있습니다.</p>
        </div>
        <a
          href={GITHUB_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          GitHub 저장소 보기
        </a>
      </section>
    </main>
  );
}
