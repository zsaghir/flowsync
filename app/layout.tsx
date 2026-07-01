// app/layout.tsx
import "./globals.css";
import "pixel-retroui/dist/index.css";
import "pixel-retroui/dist/fonts.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/app/components/Contexts";
import { ThemeProvider } from "@/app/components/ThemeContext";
import { themeVars } from "@/app/theme";

export const metadata: Metadata = {
  title: "Flowsync",
  description: "Simple Pomodoro with bunny!!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning style={themeVars}>
        <ThemeProvider>
          <AuthProvider>
            <main className="min-h-screen text-white font-serif">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
