import type { CSSProperties } from "react";

// Single source of truth for colors.
// The active palette is chosen at runtime by ThemeContext (cycled via the
// navbar theme button and persisted in localStorage).

export const palettes = {
  espresso: {
    bg: "#FFF2D8",
    bgEdge: "#f5e8c4",
    surface: "#EAD7BB",
    card: "#BCA37F",
    ink: "#113946",
    inkMuted: "#5D7480",
    line: "#113946",
    lineStrong: "#113946",
    accent: "#113946",
    accentText: "#FFF2D8",
  },
  matcha: {
    bg: "#EFF1E4",
    bgEdge: "#e1e5cf",
    surface: "#D4DDBC",
    card: "#A3B48B",
    ink: "#2F3A2A",
    inkMuted: "#6A7861",
    line: "#2F3A2A",
    lineStrong: "#2F3A2A",
    accent: "#D96C4F",
    accentText: "#FFF6EC",
  },
  sunset: {
    bg: "#FDF3E3",
    bgEdge: "#f6e4c6",
    surface: "#F8DFB6",
    card: "#F2BC79",
    ink: "#46312A",
    inkMuted: "#8A6F5F",
    line: "#46312A",
    lineStrong: "#46312A",
    accent: "#DE5B44",
    accentText: "#FDF3E3",
  },
  lavender: {
    bg: "#F5F2FB",
    bgEdge: "#e6e0f3",
    surface: "#DFD7F2",
    card: "#9C8CC9",
    ink: "#2F2A4A",
    inkMuted: "#746D9B",
    line: "#2F2A4A",
    lineStrong: "#2F2A4A",
    accent: "#E89B66",
    accentText: "#2F2A4A",
  },
  // Midnight — cool slate dark mode, warm content
  midnight: {
    bg: "#16181D",
    bgEdge: "#101216",
    surface: "#23262E",
    card: "#31353F",
    ink: "#E9E4D8",
    inkMuted: "#7C828F",
    line: "rgba(233, 228, 216, 0.15)",
    lineStrong: "rgba(233, 228, 216, 0.35)",
    accent: "#E58B54",
    accentText: "#2A1607",
  },
};

export type PaletteName = keyof typeof palettes;
export type Theme = (typeof palettes)[PaletteName];

export const paletteOrder = Object.keys(palettes) as PaletteName[];
export const defaultPaletteName: PaletteName = "matcha";

export function varsFor(name: PaletteName) {
  const t = palettes[name];
  return {
    "--bg": t.bg,
    "--bg-edge": t.bgEdge,
    "--surface": t.surface,
    "--card": t.card,
    "--ink": t.ink,
    "--ink-muted": t.inkMuted,
    "--line": t.line,
    "--line-strong": t.lineStrong,
    "--accent": t.accent,
    "--accent-text": t.accentText,
  } as CSSProperties;
}

// SSR default applied on <body>; ThemeContext overrides it client-side.
export const themeVars = varsFor(defaultPaletteName);
