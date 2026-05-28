"use client";
import { useState, useEffect } from "react";
import { SettingsContext } from "./components/Contexts";
import Tasks from "./components/Tasks";
import UserProfile from "./components/UserProfile";
import Setting from "./components/Setting";
import UserTasks from "./components/UserTasks";
import { useAuth } from "@/app/components/Contexts";
import Timer from "./components/Timer";

export default function Page() {
  const [pomodoroTime, setPomodoroTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [music, setMusic] = useState("None");
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <SettingsContext.Provider
      value={{
        pomodoroTime,
        setPomodoroTime,
        breakTime,
        setBreakTime,
        music,
        setMusic,
      }}
    >
      {/* Navbar */}
      <header className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-[#D6DAC8] sticky top-0 z-50">
        <img
          src="/flowsync-hourglass.svg"
          alt="FlowSync"
          className="h-6 sm:h-10 w-auto max-w-[120px] sm:max-w-[160px] shrink-0"
        />
        <div className="flex gap-2 sm:gap-4 items-center">
          <UserProfile />
          <Setting />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100svh-64px)] w-full px-3 sm:px-6 py-6 sm:py-10 gap-6 sm:gap-10 overflow-x-hidden">
        <Timer />
        {mounted && !loading ? (user ? <UserTasks /> : <Tasks />) : <Tasks />}
      </div>
    </SettingsContext.Provider>
  );
}
