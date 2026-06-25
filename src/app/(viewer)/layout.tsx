import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import SceneSidebar from "@/features/scene/components/SceneSidebar";
import ViewerSidebarTrigger from "@/features/scene/components/ViewerSidebarTrigger";

export default function ViewerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <SceneSidebar />
      <ViewerSidebarTrigger />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-gray-900">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
