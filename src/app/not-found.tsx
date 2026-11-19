import ServiceSuspendedNotice from "@/components/ServiceSuspendedNotice";

/**
 * 뷰어 공개 중단 이후 기존 `/scenes/...` 등 모든 경로에서도
 * 동일한 공개 중단 안내를 표시합니다.
 */
export default function NotFound() {
  return <ServiceSuspendedNotice />;
}
