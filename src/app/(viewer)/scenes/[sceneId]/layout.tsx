import { TooltipProvider } from "@/components/ui/tooltip";

export default function SceneLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
