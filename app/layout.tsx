// app/layout.tsx
import "./globals.css";
import "pixel-retroui/dist/index.css";
import "pixel-retroui/dist/fonts.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/app/components/Contexts";

export const metadata: Metadata = {
  title: "Pomodoro App",
  description: "Productivity Pomodoro App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <main className="min-h-screen text-white font-serif">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
