import Image from "next/image";

import type { SceneCatalogItem } from "@/features/scene/lib/scenes";

type SceneCardProps = {
  scene: SceneCatalogItem;
};

export default function SceneCard({ scene }: SceneCardProps) {
  return (
    <figure className="flex min-w-0 flex-1 items-center gap-2">
      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted group-data-[collapsible=icon]:size-6">
        <Image
          src={scene.thumbnailPath}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <figcaption className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium">{scene.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {scene.description}
        </p>
      </figcaption>
    </figure>
  );
}
