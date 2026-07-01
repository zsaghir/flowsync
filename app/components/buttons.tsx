"use client";

import React from "react";
import { Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";

export function PlayButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { theme } = useTheme();
  return (
    <Button
      {...props}
      bg={theme.accent}
      textColor={theme.accentText}
      borderColor={theme.ink}
      shadow={theme.ink}
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
    >
      START
    </Button>
  );
}

export function PauseButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { theme } = useTheme();
  return (
    <Button
      {...props}
      bg={theme.accent}
      textColor={theme.accentText}
      borderColor={theme.ink}
      shadow={theme.ink}
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
    >
      PAUSE
    </Button>
  );
}

export function Break(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { theme } = useTheme();
  return (
    <Button
      {...props}
      bg={theme.surface}
      textColor={theme.ink}
      borderColor={theme.ink}
      shadow={theme.ink}
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
    >
      BREAK
    </Button>
  );
}
