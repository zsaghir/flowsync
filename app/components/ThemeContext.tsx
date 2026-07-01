"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { palettes, paletteOrder, varsFor, defaultPaletteName, type PaletteName, type Theme } from "@/app/theme";

const STORAGE_KEY = "flowsync-theme";

const ThemeContext = createContext<{
  theme: Theme;
  paletteName: PaletteName;
  cyclePalette: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [paletteName, setPaletteName] = useState<PaletteName>(defaultPaletteName);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in palettes) setPaletteName(saved as PaletteName);
  }, []);

  useEffect(() => {
    const vars = varsFor(paletteName) as Record<string, string>;
    for (const [key, value] of Object.entries(vars)) {
      document.body.style.setProperty(key, value);
    }
    localStorage.setItem(STORAGE_KEY, paletteName);
  }, [paletteName]);

  const cyclePalette = () =>
    setPaletteName((current) => paletteOrder[(paletteOrder.indexOf(current) + 1) % paletteOrder.length]);

  return (
    <ThemeContext.Provider value={{ theme: palettes[paletteName], paletteName, cyclePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
