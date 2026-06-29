import { cn } from "@/lib/utils";
import type {
  ChangeType,
  DisplayPriority,
  SceneObject,
  ShapeType,
  UpdateType,
} from "@/features/scene/types/scene";

const changeTypeLabels: Record<ChangeType, string> = {
  new: "신축",
  removed: "소멸",
  updated: "갱신",
};

const updateTypeLabels: Record<UpdateType, string> = {
  floor_change: "층 변화",
  steel_frame_completed: "철골구조 완성",
  structure_added: "설치·구조물 추가",
  roof_color_changed: "옥상 색상 변화",
  outline_changed: "외곽선 변화",
};

const shapeTypeLabels: Record<ShapeType, string> = {
  complete: "전체가 온전한 건물",
  partial: "일부가 잘린 건물",
};

const displayPriorityLabels: Record<DisplayPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

type ObjectDetailPanelProps = {
  object: SceneObject | null;
  className?: string;
};

type DetailRowProps = {
  label: string;
  children: React.ReactNode;
};

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 py-2">
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd className="min-w-0 text-sm text-slate-100">{children}</dd>
    </div>
  );
}

export function ObjectDetailPanel({
  object,
  className,
}: ObjectDetailPanelProps) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-white/10 bg-gray-950/85 p-4 text-white shadow-lg backdrop-blur",
        className,
      )}
      aria-labelledby="object-detail-title"
      aria-live="polite"
    >
      <h2 id="object-detail-title" className="text-sm font-semibold">
        객체 상세 정보
      </h2>

      {object ? (
        <dl className="mt-3 divide-y divide-white/10">
          <DetailRow label="ID">
            <span className="break-all">{object.id}</span>
          </DetailRow>
          <DetailRow label="변화유형">
            {changeTypeLabels[object.changeType]}
          </DetailRow>
          <DetailRow label="갱신유형">
            {object.updateTypes.length > 0
              ? object.updateTypes.map((type) => updateTypeLabels[type]).join(", ")
              : "없음"}
          </DetailRow>
          <DetailRow label="외형 상태">
            {shapeTypeLabels[object.shapeType]}
          </DetailRow>
          <DetailRow label="표시 우선순위">
            {displayPriorityLabels[object.displayPriority]}
          </DetailRow>
        </dl>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          지도에서 변화 객체를 선택해 주세요.
        </p>
      )}
    </aside>
  );
}
