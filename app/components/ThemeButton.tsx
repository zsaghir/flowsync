"use client";

import { Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";

const ThemeButton = () => {
  const { theme, paletteName, cyclePalette } = useTheme();

  return (
    <Button
      bg={theme.surface}
      textColor={theme.ink}
      borderColor={theme.ink}
      shadow={theme.ink}
      onClick={cyclePalette}
      title={`Theme: ${paletteName} — click for next`}
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
    >
      <span aria-hidden="true">🎨</span>
      <span className="ml-2 uppercase tracking-widest text-xs whitespace-nowrap text-[var(--ink)]">{paletteName}</span>
    </Button>
  );
};

export default ThemeButton;
