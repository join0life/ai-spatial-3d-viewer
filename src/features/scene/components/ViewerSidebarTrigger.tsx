"use client";

import {
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

export default function ViewerSidebarTrigger() {
  const { isMobile, state } = useSidebar();

  if (!isMobile && state === "expanded") {
    return null;
  }

  return (
    <SidebarTrigger />
  );
}
