"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, Input, Button,
} from "pixel-retroui";

type Task = { id: string; title: string; completed: boolean };

const UserTasks = () => {
  const { token } = useAuth();
  const [taskList, setTaskList]   = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState("");

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    fetch("/api/tasks", { headers: authHeader })
      .then((r) => r.json())
      .then(setTaskList)
      .catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTask = async () => {
    if (!taskInput.trim()) return;
    const title = taskInput.trim();
    setTaskInput("");
    const tempId = `tmp-${Date.now()}`;
    setTaskList((p) => [...p, { id: tempId, title, completed: false }]);
    try {
      const res  = await fetch("/api/tasks", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body:    JSON.stringify({ title }),
      });
      const saved = await res.json();
      setTaskList((p) => p.map((t) => (t.id === tempId ? saved : t)));
    } catch {}
  };

  const toggleTask = async (id: string, completed: boolean) => {
    setTaskList((p) => p.map((t) => (t.id === id ? { ...t, completed } : t)));
    try {
      await fetch(`/api/tasks/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body:    JSON.stringify({ completed }),
      });
    } catch {}
  };

  const deleteTask = async (id: string) => {
    setTaskList((p) => p.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE", headers: authHeader });
    } catch {}
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <Input bg="white" textColor="black" borderColor="black" placeholder="Enter a task..."
          value={taskInput} onChange={(e) => setTaskInput(e.target.value)} />

        <Button bg="#D6DAC8" textColor="#30210b" borderColor="#30210b" shadow="#30210b"
          className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
          onClick={addTask}>
          Add
        </Button>

        <DropdownMenu bg="#D6DAC8" textColor="black" borderColor="black" shadowColor="#30210b">
          <DropdownMenuTrigger>Tasks ({taskList.length})</DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 p-2 space-y-2">
            {taskList.length === 0 ? (
              <p className="text-sm italic text-gray-600">No tasks yet</p>
            ) : (
              taskList.map((task) => (
                <div key={task.id} className="flex justify-between items-center bg-white/40 rounded px-2 py-1">
                  <span className={task.completed ? "line-through text-gray-500" : "text-black"}>
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
