"use client";

import React, { useContext, useState } from "react";
import { SettingsContext } from "./Contexts";
import { Popup, Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";

const Setting = () => {
  const settingsInfo = useContext(SettingsContext)!;
  const { theme } = useTheme();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [tempPomodoro, setTempPomodoro] = useState(settingsInfo.pomodoroTime);
  const [tempBreak, setTempBreak] = useState(settingsInfo.breakTime);
  const [tempAutoSwitch, setTempAutoSwitch] = useState(settingsInfo.autoSwitch);

  const openPopup = () => {
    setTempPomodoro(settingsInfo.pomodoroTime);
    setTempBreak(settingsInfo.breakTime);
    setTempAutoSwitch(settingsInfo.autoSwitch);
    setIsPopupOpen(true);
  };
  const closePopup = () => setIsPopupOpen(false);

  const handleSave = () => {
    settingsInfo.setPomodoroTime(tempPomodoro);
    settingsInfo.setBreakTime(tempBreak);
    settingsInfo.setAutoSwitch(tempAutoSwitch);
    closePopup();
  };

  return (
    <div className="flex items-center">
      <Button
        bg={theme.surface}
        textColor={theme.ink}
        borderColor={theme.ink}
        shadow={theme.ink}
        className="pixel-outline transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
        onClick={openPopup}
      >
        EDIT
      </Button>

      <Popup isOpen={isPopupOpen} onClose={closePopup}>
        <div className="flex flex-col bg-[var(--bg)] border-[3px] border-[color:var(--ink)] shadow-[6px_6px_0_var(--ink)] w-[min(20rem,88vw)] max-w-full max-h-[calc(100svh-6.5rem)] overflow-hidden">
          <div className="bg-[var(--ink)] px-4 py-2 shrink-0">
            <h2 className="pixel-font text-sm font-bold text-[var(--bg)] tracking-[0.25em]">⏱ EDIT TIMES</h2>
          </div>
          <div className="flex flex-col space-y-4 p-4 sm:p-5 min-h-0 overflow-y-auto">

          <label className="text-sm font-bold text-[var(--ink)]">
            Pomodoro Time (min):
            <input
              type="number"
              value={tempPomodoro}
              min={1}
              max={120}
              onChange={(e) => setTempPomodoro(Number(e.target.value))}
              className="mt-1 w-full p-2 bg-[var(--bg)] border-2 border-[color:var(--ink)] shadow-[3px_3px_0_var(--ink)] text-[var(--ink)] font-semibold focus:outline-none focus:bg-[var(--surface)]"
            />
          </label>

          <label className="text-sm font-bold text-[var(--ink)]">
            Break Time (min):
            <input
              type="number"
              value={tempBreak}
              min={1}
              max={120}
              onChange={(e) => setTempBreak(Number(e.target.value))}
              className="mt-1 w-full p-2 bg-[var(--bg)] border-2 border-[color:var(--ink)] shadow-[3px_3px_0_var(--ink)] text-[var(--ink)] font-semibold focus:outline-none focus:bg-[var(--surface)]"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-[var(--ink)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={tempAutoSwitch}
              onChange={(e) => setTempAutoSwitch(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            Auto-switch: start break / pomodoro automatically
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              bg={theme.accent}
              textColor={theme.accentText}
              borderColor={theme.ink}
              shadow={theme.ink}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              bg={theme.surface}
              textColor={theme.ink}
              borderColor={theme.ink}
              shadow={theme.ink}
              onClick={closePopup}
            >
              Cancel
            </Button>
          </div>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default Setting;
