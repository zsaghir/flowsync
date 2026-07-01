"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/Contexts";
import { Card, Input, Button } from "pixel-retroui";
import { useTheme } from "./ThemeContext";

import { dataApi } from "@/lib/client/api";
import { openFlowsyncDb } from "./db";
import z from "zod"
import { TaskSchema, TasksArraySchema } from "@/lib/client/api"


type TasksArray = z.infer<typeof TasksArraySchema>
type Task = z.infer<typeof TaskSchema>


const saveTaskSchema = z.object({
  title: z.string(),
  completed: z.union([z.number(), z.boolean()])

})

// Guest tasks live in IndexedDB so they survive reloads without an account.
const openDb = openFlowsyncDb;

const UserTasks = () => {
  const { accessToken, dataKey, clearAuth } = useAuth();
  const { theme } = useTheme();
  const isGuest = !accessToken || !dataKey;
  const [taskList, setTaskList] = useState<TasksArray>([]);
  const [taskInput, setTaskInput] = useState("");
  const announcedCompleteRef = useRef(false);
  const undoneTaskCount = taskList.filter((task) => !
    task.completed).length;
  const sortedTasks = [...taskList].sort(
    (a, b) => Number(a.completed) - Number(b.completed)
  );


  useEffect(() => {
    let cancelled = false;

    if (isGuest) {
      openDb()
        .then((db) => db.getAll("tasks"))
        .then((tasks) => {
          if (!cancelled) setTaskList(TasksArraySchema.parse(tasks));
        })
        .catch((error) => {
          console.log(error);
          if (!cancelled) setTaskList([]);
        });

      return () => {
        cancelled = true;
      };
    }

    dataApi.fetchData(dataKey, accessToken, "/api/tasks/")
      .then((_tasks) => {
        const tasks = TasksArraySchema.parse(_tasks)
        if (!cancelled) setTaskList(tasks);
      })
      .catch((error) => {
        clearAuth("Error while fetchign task")
        console.log(error)
        if (!cancelled) setTaskList([]);
        throw error

      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (isGuest) {
      const task: Task = { id: crypto.randomUUID(), title, completed: false };
      setTaskList((p) => [...p, task]);
      try {
        const db = await openDb();
        await db.put("tasks", task);
      } catch (error) {
        console.log(error);
      }
      return;
    }

    const tempId = `tmp-${Date.now()}`;
    setTaskList((p) => [...p, { id: tempId, title, completed: false }]);
    try {
      if (!dataKey || !accessToken) throw Error("User information corrupted")
      const res = await dataApi.sendData(dataKey, accessToken, "/api/tasks",
        {
          body: JSON.stringify(saveTaskSchema.parse(
            {
              title,
              completed: 0
            })),
          method: "POST"
        }
      )
      const saved = await res.json();
      if (!res.ok || !saved?.id) {
        setTaskList((p) => p.filter((t) => t.id !== tempId));
        return;
      }
      setTaskList((p) => p.map((t) => (t.id === tempId ? { ...t, id: saved.id } : t)

      ));
    } catch (error) {
      setTaskList((p) => p.filter((t) => t.id !== tempId));
      console.log(error)
    }
  };

  const toggleTask = async (id: string, completed: boolean, title: string) => {
    setTaskList((p) => p.map((t) => (t.id === id ? { ...t, completed } : t)));

    if (isGuest) {
      try {
        const db = await openDb();
        await db.put("tasks", { id, title, completed });
      } catch (error) {
        console.log(error);
      }
      return;
    }

    try {
      if (!accessToken || !dataKey) {
        throw Error("Corrupted User Cache");
      }
      await dataApi.sendData(dataKey, accessToken, `/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(saveTaskSchema.parse({
          title,
          completed
        })),
      });
    } catch (error) { clearAuth("Error while updating task"); throw error }
  };

  const deleteTask = async (id: string) => {
    setTaskList((p) => p.filter((t) => t.id !== id));

    if (isGuest) {
      try {
        const db = await openDb();
        await db.delete("tasks", id);
      } catch (error) {
        console.log(error);
      }
      return;
    }

    try {
      if (!accessToken || !dataKey) throw new Error("Corrupted user cache")
      await dataApi.sendData(dataKey, accessToken, `/api/tasks/${id}`, { method: "DELETE", body: null });
    } catch (error) { clearAuth("Error while deleting task"); throw error }
  };

  return (
    <Card bg={theme.surface} className="w-[min(92vw,620px)] px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="pixel-font font-bold tracking-[0.2em] text-lg text-[var(--ink)]">TASKS</h2>
        {taskList.length > 0 && (
          <span className="text-[10px] font-extrabold tracking-widest tabular-nums bg-[var(--ink)] text-[var(--bg)] px-2 py-1">
            {undoneTaskCount === 0 ? "ALL DONE!" : `${undoneTaskCount} LEFT`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input bg={theme.bg} textColor={theme.ink} borderColor={theme.ink} placeholder="Enter a task..."
          value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="flex-1 min-w-[10rem]" />

        <Button bg={theme.accent} textColor={theme.accentText} borderColor={theme.ink} shadow={theme.ink}
          className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
          onClick={addTask}>
          Add
        </Button>
      </div>

      {taskList.length === 0 ? (
        <p className="text-sm italic font-semibold text-[var(--ink)]/70 text-center py-2">
          No tasks yet — add one above!
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {sortedTasks.map((task) => (
            <div key={task.id}
              onClick={() => toggleTask(task.id, !Boolean(task.completed), task.title)}
              role="button"
              aria-label={task.completed ? "Mark as not done" : "Mark as done"}
              className={`sketch-border flex items-center gap-3 border-2 border-[color:var(--ink)] px-3 py-2 cursor-pointer select-none transition-all duration-100 shadow-[3px_3px_0_var(--ink)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)] active:translate-y-0.5 active:shadow-none ${task.completed ? "bg-[var(--card)]/50" : "bg-[var(--bg)]"
                }`}>
              <span
                className={`sketch-border-sm w-6 h-6 shrink-0 border-2 border-[color:var(--ink)]
  outline outline-2 outline-[color:var(--ink)] shadow-[2px_2px_0_var(--ink)] flex items-center justify-center
                   ${task.completed ? "bg-[var(--accent)]" : "bg-white"
                  }`}>
                {Boolean(task.completed) && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke={theme.accentText} strokeWidth={4} strokeLinecap="square" className="w-4 h-4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className={`flex-1 min-w-0 break-words text-sm font-semibold ${task.completed ? "line-through text-[var(--ink)]/50" : "text-[var(--ink)]"
                }`}>
                {task.title}
              </span>
              {Boolean(task.completed) && (
                <span className="shrink-0 text-[10px] font-extrabold tracking-widest text-[var(--accent-text)] bg-[var(--accent)] border-2 border-[color:var(--ink)] px-1.5 py-0.5">
                  DONE
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                aria-label="Delete task"
                className="p-1 shrink-0 hover:scale-125 transition">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="#b3564a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default UserTasks;
