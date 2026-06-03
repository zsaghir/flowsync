"use client";

import React, { useContext, useState } from "react";
import { SettingsContext } from "./Contexts";
import { Popup, Button } from "pixel-retroui";

const musicOptions = [
  { label: "None", value: "None" },
  { label: "Focus", value: "/focus.mp3" },
  { label: "Lo-fi", value: "/jazz.mp3" },
  { label: "Rain", value: "/rain.mp3" },
  { label: "Brown-Noise", value: "/brownNoise.mp3" }
];

const Setting = () => {


  //Managing Popup State
  const settingsInfo = useContext(SettingsContext)!;
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  //Managing choosing music state before saving
  const [tempPomodoro, setTempPomodoro] = useState(settingsInfo.pomodoroTime);
  const [tempBreak, setTempBreak] = useState(settingsInfo.breakTime);
  const [tempmusic, settempMusic] = useState(
    typeof settingsInfo.music === "string" ? settingsInfo.music : "None",
  );
  const [musicOpen, setMusicOpen] = useState(false);

  //functions for poup
  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  //Once save buton is saved
  const handleSave = () => {
    settingsInfo.setPomodoroTime(tempPomodoro);
    settingsInfo.setBreakTime(tempBreak);
    if (settingsInfo.setMusic) settingsInfo.setMusic(tempmusic);
    closePopup();
  };

  return (
    <div className="flex items-center">
      {/* Settings Button */}
      <Button
        bg="#D6DAC8"
        textColor="black"
        borderColor="black"
        onClick={openPopup}
      >
        Settings
      </Button>

      {/* Settings Popup */}
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

          <div className="relative">
            <label className="text-sm font-semibold text-white block mb-1">
              Music
            </label>
            <button
              onClick={() => setMusicOpen(!musicOpen)}
              className="w-full p-2 bg-transparent border border-gray-300 rounded-md shadow-sm text-white flex justify-between items-center"
            >
              {musicOptions.find((opt) => opt.value === tempmusic)?.label}
              <span className="ml-2">▾</span>
            </button>

            {musicOpen && (
              <ul className="absolute z-20 mt-1 w-full bg-[#9CAFAA]  rounded-md shadow-lg backdrop-blur">
                {musicOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() => {
                      settempMusic(option.value);
                      setMusicOpen(false);
                    }}
                    className={`px-4 py-2 cursor-pointer border-b border-white last:border-none hover:bg-[#D6A99D] hover:text-black text-white ${tempmusic === option.value
                      ? "text-[#D6A99D] bg-[#D6A99D]"
                      : ""
                      }`}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

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
