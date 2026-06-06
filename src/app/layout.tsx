import type { Metadata } from "next";
import "./globals.css";
import BottomTabBar from "@/components/BottomTabBar";
import StoreHydration from "@/components/StoreHydration";

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
      <body className="h-full">
        <div
          className="mx-auto flex flex-col h-full"
          style={{ maxWidth: "430px" }}
        >
          <StoreHydration />
          <main className="flex-1 overflow-y-auto pb-24 px-4 pt-8">
            {children}
          </main>
          <BottomTabBar />
        </div>
      </body>
    </html>
  );
}
