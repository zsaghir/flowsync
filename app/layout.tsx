// app/layout.tsx
import "./globals.css";
import "@/lib/pixel-retroui-setup.js";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";

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
