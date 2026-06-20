"use client";

import { ImagesIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import SceneCard from "@/features/scene/components/SceneCard";
import { SCENES } from "@/features/scene/lib/scenes";

export default function SceneSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2 font-semibold">
          <ImagesIcon className="size-4 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Gallery
          </span>
          {(isMobile || state === "expanded") && (
            <SidebarTrigger className="ml-auto" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>항공영상</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SCENES.map((scene) => {
                const href = `/scenes/${scene.id}`;

                return (
                  <SidebarMenuItem key={scene.id}>
                    <SidebarMenuButton
                      isActive={pathname === href}
                      tooltip={scene.label}
                      render={
                        <Link
                          href={href}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                      className="h-auto p-1.5 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-1!"
                    >
                      <SceneCard scene={scene} />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
