"use client";

import { useContext, useState } from "react";
import { SettingsContext } from "./Contexts";
import { Popup, Button } from "pixel-retroui";

const MUSIC_OPTIONS = [
  { label: "None", value: "None" },
  { label: "Focus", value: "/focus.mp3" },
  { label: "Lo-fi", value: "/jazz.mp3" },
  { label: "Rain", value: "/rain.mp3" },
  { label: "Brown-Noise", value: "/brownNoise.mp3" },
];

function MusicDropdown({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = MUSIC_OPTIONS.find((opt) => opt.value === value)?.label ?? "None";

  return (
    <div className="relative">
      <label className="text-sm font-semibold text-white block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-2 bg-transparent border border-gray-300 rounded-md shadow-sm text-white flex justify-between items-center"
      >
        {current}
        <span className="ml-2">▾</span>
      </button>

      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-[#9CAFAA] rounded-md shadow-lg backdrop-blur">
          {MUSIC_OPTIONS.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer border-b border-white last:border-none hover:bg-[#D6A99D] hover:text-black text-white ${
                value === opt.value ? "text-[#D6A99D] bg-[#D6A99D]" : ""
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const BoomBox = () => {
  const settings = useContext(SettingsContext)!;
  const [isOpen, setIsOpen] = useState(false);

  const [tempWork, setTempWork] = useState(settings.workMusic);
  const [tempBreak, setTempBreak] = useState(settings.breakMusic);
  const [tempVolume, setTempVolume] = useState(settings.volume);

  function openPopup() {
    setTempWork(settings.workMusic);
    setTempBreak(settings.breakMusic);
    setTempVolume(settings.volume);
    setIsOpen(true);
  }

  function closePopup() {
    setIsOpen(false);
  }

  function handleSave() {
    settings.setWorkMusic(tempWork);
    settings.setBreakMusic(tempBreak);
    settings.setVolume(tempVolume);
    closePopup();
  }

  return (
    <div className="flex items-center">
      <Button
        bg="#D6A99D"
        textColor="#30210b"
        borderColor="#30210b"
        shadow="#30210b"
        onClick={openPopup}
        className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 tracking-widest"
      >
        BOOMBOX
      </Button>

      <Popup isOpen={isOpen} onClose={closePopup}>
        <div className="flex flex-col space-y-4 bg-[#758581] p-4 sm:p-6 rounded-xl backdrop-blur-md border border-gray-500 w-[min(22rem,88vw)]">
          <h2 className="text-lg font-bold text-white tracking-widest">BOOMBOX</h2>
          <p className="text-xs text-white/80 -mt-2">Pick a track for work and break, and set the volume.</p>

          <MusicDropdown
            label="Work (Pomodoro & Stopwatch)"
            value={tempWork}
            onChange={setTempWork}
          />

          <MusicDropdown
            label="Break"
            value={tempBreak}
            onChange={setTempBreak}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-semibold text-white">Volume</label>
              <span className="text-sm text-white tabular-nums">
                {Math.round(tempVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(tempVolume * 100)}
              onChange={(e) => setTempVolume(Number(e.target.value) / 100)}
              className="w-full accent-[#D6A99D]"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              bg="#D6A99D"
              textColor="black"
              borderColor="black"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              bg="#D6DAC8"
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

export default BoomBox;
