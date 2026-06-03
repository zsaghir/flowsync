"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/Contexts";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, Input, Button,
} from "pixel-retroui";

type Task = { id: string; title: string; completed: boolean };

const UserTasks = () => {
  const { token, clearAuth } = useAuth();
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const announcedCompleteRef = useRef(false);
  const undoneTaskCount = taskList.filter((task) => !
    task.completed).length;
  const sortedTasks = [...taskList].sort(
    (a, b) => Number(a.completed) - Number(b.completed)
  );
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    if (!token) {
      setTaskList([]);
      return;
    }

    let cancelled = false;

    fetch("/api/tasks", { headers: authHeader })
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 401) {
          clearAuth();
          return [];
        }
        if (!r.ok || !Array.isArray(data)) return [];
        return data;
      })
      .then((tasks) => {
        if (!cancelled) setTaskList(tasks);
      })
      .catch(() => {
        if (!cancelled) setTaskList([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const allComplete = taskList.length > 0 && taskList.every((task) => task.completed);
    if (allComplete && !announcedCompleteRef.current) {
      window.dispatchEvent(new CustomEvent("flowsync:tasks-complete"));
      announcedCompleteRef.current = true;
    }
    if (!allComplete) {
      announcedCompleteRef.current = false;
    }
  }, [taskList]);

  const addTask = async () => {
    if (!taskInput.trim()) return;
    const title = taskInput.trim();
    setTaskInput("");
    const tempId = `tmp-${Date.now()}`;
    setTaskList((p) => [...p, { id: tempId, title, completed: false }]);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ title }),
      });
      const saved = await res.json();
      if (!res.ok || !saved?.id) {
        setTaskList((p) => p.filter((t) => t.id !== tempId));
        return;
      }
      setTaskList((p) => p.map((t) => (t.id === tempId ? saved : t)));
    } catch {
      setTaskList((p) => p.filter((t) => t.id !== tempId));
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    setTaskList((p) => p.map((t) => (t.id === id ? { ...t, completed } : t)));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ completed }),
      });
    } catch { }
  };

  const deleteTask = async (id: string) => {
    setTaskList((p) => p.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE", headers: authHeader });
    } catch { }
  };

  return (
    <div className="flex flex-col items-center w-full px-1">
      <div className="flex flex-wrap justify-center items-center gap-2 w-full max-w-[min(92vw,520px)]">
        <Input bg="white" textColor="black" borderColor="black" placeholder="Enter a task..."
          value={taskInput} onChange={(e) => setTaskInput(e.target.value)} className="w-full sm:w-auto" />

        <Button bg="#D6DAC8" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
          className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
          onClick={addTask}>
          Add
        </Button>

        <DropdownMenu bg="#D6DAC8" textColor="black" borderColor="black" shadowColor="#30210b">
          <DropdownMenuTrigger>Tasks ({undoneTaskCount})</DropdownMenuTrigger>
          <DropdownMenuContent className="w-[min(18rem,88vw)] p-2 space-y-2">
            {taskList.length === 0 ? (
              <p className="text-sm italic text-gray-600">No tasks yet</p>
            ) : (
              sortedTasks.map((task) => (
                <div key={task.id} className="flex justify-between items-center gap-2 bg-white/40 rounded px-2 py-1">
                  <span className={`${task.completed ? "line-through text-gray-500" : "text-black"} min-w-0 break-words`}>
                    • {task.title}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleTask(task.id, !task.completed)} className="p-1 hover:scale-110 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke={task.completed ? "lightgreen" : "gray"}
                        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1 hover:scale-110 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                        stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default UserTasks;
