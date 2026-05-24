import React from "react";
import { Button } from "pixel-retroui";

function Pomodoro(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      bg="#D6DAC8"
      textColor="#30210b"
      borderColor="#30210b"
      shadow="#30210b"
      className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
    >
      POMODORO
    </Button>
  );
}

export default Pomodoro;
