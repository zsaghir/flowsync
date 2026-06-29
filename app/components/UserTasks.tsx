"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/components/Contexts";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, Input, Button,
} from "pixel-retroui";

import { dataApi } from "@/lib/client/api";
import { openDB } from "idb";
import z from "zod"
import { TaskSchema, TasksArraySchema } from "@/lib/client/api"


type TasksArray = z.infer<typeof TasksArraySchema>
type Task = z.infer<typeof TaskSchema>


const saveTaskSchema = z.object({
  title: z.string(),
  completed: z.union([z.number(), z.boolean()])

})

// Guest tasks live in IndexedDB so they survive reloads without an account.
const openDb = () =>
  openDB("flowsync", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tasks")) {
        db.createObjectStore("tasks", { keyPath: "id" });
      }
    },
  });

const UserTasks = () => {
  const { accessToken, dataKey, clearAuth } = useAuth();
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
          <DropdownMenuContent className="w-[min(18rem,88vw)] p-2 space-y-2 max-sm:!fixed max-sm:!left-1/2 max-sm:!top-1/2 max-sm:!-translate-x-1/2 max-sm:!-translate-y-1/2 max-sm:!z-50">
            {taskList.length === 0 ? (
              <p className="text-sm italic text-gray-600">No tasks yet</p>
            ) : (
              sortedTasks.map((task) => (
                <div key={task.id} className="flex justify-between items-center gap-2 bg-white/40 rounded px-2 py-1">
                  <span className={`${task.completed ? "line-through text-gray-500" : "text-black"} min-w-0 break-words`}>
                    • {task.title}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleTask(task.id, !Boolean(task.completed), task.title)} className="p-1 hover:scale-110 transition">
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
