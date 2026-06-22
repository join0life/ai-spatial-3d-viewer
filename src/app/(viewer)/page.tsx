import { redirect } from "next/navigation";

import { DEFAULT_SCENE_ID } from "@/features/scene/lib/scenes";

export default function ViewerPage() {
  redirect(`/scenes/${DEFAULT_SCENE_ID}`);
}
