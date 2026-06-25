import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DragonMind",
  description: "DragonMind v0.1 local-first cognitive workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
