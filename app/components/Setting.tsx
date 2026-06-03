"use client";

import React, { useContext, useState } from "react";
import { SettingsContext } from "./Contexts";
import { Popup, Button } from "pixel-retroui";

const Setting = () => {
  const settingsInfo = useContext(SettingsContext)!;
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [tempPomodoro, setTempPomodoro] = useState(settingsInfo.pomodoroTime);
  const [tempBreak, setTempBreak] = useState(settingsInfo.breakTime);

  const openPopup = () => {
    setTempPomodoro(settingsInfo.pomodoroTime);
    setTempBreak(settingsInfo.breakTime);
    setIsPopupOpen(true);
  };
  const closePopup = () => setIsPopupOpen(false);

  const handleSave = () => {
    settingsInfo.setPomodoroTime(tempPomodoro);
    settingsInfo.setBreakTime(tempBreak);
    closePopup();
  };

  return (
    <div className="flex items-center">
      <Button
        bg="#D6DAC8"
        textColor="black"
        borderColor="black"
        onClick={openPopup}
      >
        Settings
      </Button>

      <Popup isOpen={isPopupOpen} onClose={closePopup}>
        <div className="flex flex-col space-y-4 bg-[#758581] p-4 sm:p-6 rounded-xl backdrop-blur-md border border-gray-500 w-[min(20rem,88vw)]">
          <h2 className="text-lg font-bold text-white">Settings</h2>

          <label className="text-sm font-semibold text-white">
            Pomodoro Time (min):
            <input
              type="number"
              value={tempPomodoro}
              min={1}
              max={120}
              onChange={(e) => setTempPomodoro(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-transparent text-white"
            />
          </label>

          <label className="text-sm font-semibold text-white">
            Break Time (min):
            <input
              type="number"
              value={tempBreak}
              min={1}
              max={120}
              onChange={(e) => setTempBreak(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-transparent text-white"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              bg="#D6A99D"
              textColor="black"
              borderColor="black"
              onClick={handleSave}
            >
              Save Settings
            </Button>
            <Button
              bg="#D6A99D"
              textColor="black"
              borderColor="black"
              onClick={closePopup}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default Setting;
