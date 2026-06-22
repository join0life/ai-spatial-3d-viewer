import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Spatial 3D Viewer",
  description:
    "AI Spatial 3D Viewer is a web application that allows users to visualize and interact with 3D spatial data. It provides tools for exploring, analyzing, and manipulating 3D models and scenes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
