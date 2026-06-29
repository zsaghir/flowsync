"use client";
import { useState } from "react";
import { SettingsContext, StopwatchRulesProvider } from "./components/Contexts";
import UserProfile from "./components/UserProfile";
import Setting from "./components/Setting";
import BoomBox from "./components/BoomBox";
import UserTasks from "./components/UserTasks";
import Timer from "./components/Timer";

export default function Page() {
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [workMusic, setWorkMusic] = useState("None");
  const [breakMusic, setBreakMusic] = useState("None");
  const [volume, setVolume] = useState(0.6);

  return (
    <SettingsContext.Provider
      value={{
        pomodoroTime,
        setPomodoroTime,
        breakTime,
        setBreakTime,
        workMusic,
        setWorkMusic,
        breakMusic,
        setBreakMusic,
        volume,
        setVolume,
      }}
    >
      <StopwatchRulesProvider>
        {/* Navbar */}
        <header className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-end bg-[#D6DAC8] backdrop-blur-md sticky top-0 z-50">
          <div className="flex gap-2 sm:gap-4 items-center">
            <UserProfile />
            <BoomBox />
            <Setting />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100svh-64px)] w-full px-3 sm:px-6 py-6 sm:py-10 gap-6 sm:gap-10 overflow-x-hidden">
          <Timer />
          <UserTasks />
        </div>
      </StopwatchRulesProvider>
    </SettingsContext.Provider>
  );
}
