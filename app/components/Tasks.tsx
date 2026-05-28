"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuTrigger,
  Button,
  Input,
} from "pixel-retroui";

const Tasks = () => {
  const [taskInput, setTaskInput] = useState("");
  const [taskList, setTaskList] = useState<
    { completed: boolean; id: number; title: string }[]
  >([]);
  const announcedCompleteRef = useRef(false);

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

  const addTask = () => {
    if (taskInput.trim() !== "") {
      const newTask = {
        completed: false,
        id: Date.now(),
        title: taskInput,
      };
      setTaskList((prev) => [...prev, newTask]);
      setTaskInput("");
    }
  };

  const deleteTask = (taskId: number) => {
    const newList = taskList.filter((task) => task.id !== taskId);
    setTaskList(newList);
  };

  const completedTask = (taskId: number) => {
    const updatedTaskList = taskList.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );
    setTaskList(updatedTaskList);
  };

  return (
    <div className="flex flex-col items-center w-full px-1">
      <div className="flex flex-wrap justify-center items-center gap-2 w-full max-w-[min(92vw,520px)]">
        <Input
          bg="white"
          textColor="black"
          borderColor="black"
          placeholder="Enter a task..."
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          className="w-full sm:w-auto"
        />

        <Button
          bg="#D6DAC8"
          textColor="#30210b"
          borderColor="#30210b"
          shadow="#30210b"
          className="transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-110"
          onClick={addTask}
        >
          Add
        </Button>

        <DropdownMenu
          bg="#D6DAC8"
          textColor="black"
          borderColor="black"
          shadowColor="#30210b"
        >
          <DropdownMenuTrigger>Tasks ({taskList.length})</DropdownMenuTrigger>

          <DropdownMenuContent className="w-[min(18rem,88vw)] p-2 space-y-2">
            {taskList.length === 0 ? (
              <p className="text-sm italic text-gray-600">No tasks yet</p>
            ) : (
              taskList.map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between items-center gap-2 bg-white/40 rounded px-2 py-1"
                >
                  <span
                    className={`min-w-0 break-words ${
                      task.completed
                        ? "line-through text-gray-500"
                        : "text-black"
                    }`}
                  >
                    • {task.title}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => completedTask(task.id)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={task.completed ? "lightgreen" : "gray"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
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

export default Tasks;
