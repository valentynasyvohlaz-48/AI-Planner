import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";

export const metadata: Metadata = {
  title: "AI Planner",
  description: "AI-планер дня — перетворює хаос у структуровані задачі",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full">
      <body className="h-full" style={{ background: "var(--bg)", color: "var(--fg)" }}>
        <div
          className="mx-auto flex flex-col h-full"
          style={{ maxWidth: "430px" }}
        >
          <main className="flex-1 overflow-y-auto pb-20 px-4 pt-6">
            {children}
          </main>
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
