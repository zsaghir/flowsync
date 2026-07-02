"use client";

import React from "react";
import { Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";

function Pomodoro(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
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
      POMODORO
    </Button>
  );
}

export default Pomodoro;
