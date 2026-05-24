import React from "react";
import { Button } from "pixel-retroui";

export function PlayButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      bg="#D6A99D"
      textColor="#30210b"
      borderColor="#30210b"
      shadow="#30210b"
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 w-full py-2"
    >
      START
    </Button>
  );
}

export function PauseButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      bg="#D6A99D"
      textColor="#30210b"
      borderColor="#30210b"
      shadow="#30210b"
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 w-full py-2"
    >
      Pause
    </Button>
  );
}

export function Break(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      bg="#D6DAC8"
      textColor="#30210b"
      borderColor="#30210b"
      shadow="#30210b"
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
    >
      BREAK
    </Button>
  );
}
