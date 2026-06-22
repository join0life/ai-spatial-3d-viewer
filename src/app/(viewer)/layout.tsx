import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import SceneSidebar from "@/features/scene/components/SceneSidebar";
import ViewerSidebarTrigger from "@/features/scene/components/ViewerSidebarTrigger";

export default function ViewerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <SceneSidebar />
      <SidebarInset>
        <ViewerSidebarTrigger />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
