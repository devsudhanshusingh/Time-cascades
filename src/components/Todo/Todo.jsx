// Todo.jsx

import React, { useState } from "react";
import "./Todo.css";

const Todo = () => {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    if (!task.trim()) return;

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: task,
        completed: false,
      },
    ]);

    setTask("");
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
            }
          : item,
      ),
    );
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((item) => !item.completed));
  };

  return (
    <div className="todo-card">
      {/* HEADER */}

      <div className="todo-header">
        <span>☑️</span>

        <h1>Todo List</h1>
      </div>

      {/* INPUT */}

      <div className="todo-input-box">
        <input
          type="text"
          placeholder="Add a new task..."
          value={task}
          onChange={(e) => setTask(e.target.value)}
        />

        <button onClick={addTask}>Add</button>
      </div>

      {/* TASKS */}

      <div className="todo-tasks">
        {tasks.map((item) => (
          <div
            key={item.id}
            className={`todo-task ${item.completed ? "completed" : ""}`}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleTask(item.id)}
            />

            <p>{item.text}</p>
          </div>
        ))}
      </div>

      {/* FOOTER */}

      <div className="todo-footer">
        <p>{tasks.filter((item) => !item.completed).length} tasks remaining</p>

        <button onClick={clearCompleted}>Clear Completed</button>
      </div>
    </div>
  );
};

export default Todo;
