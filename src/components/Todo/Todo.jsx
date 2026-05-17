// Todo.jsx

import React, { useEffect, useState } from "react";

import axios from "axios";

import "./Todo.css";

const Todo = () => {
  const [text, setText] = useState("");

  const [type, setType] = useState("");

  const [completionDate, setCompletionDate] = useState("");

  const [tasks, setTasks] = useState([]);

  /* FETCH TODOS */

  const fetchTodos = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/todos");

      setTasks(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  /* ADD TASK */

  const addTask = async () => {
    if (!text.trim() || !type || !completionDate) return;

    try {
      const res = await axios.post("http://localhost:5000/api/todos", {
        type,
        text,
        completionDate,
      });

      setTasks([res.data, ...tasks]);

      setText("");
      setType("");
      setCompletionDate("");
    } catch (error) {
      console.log(error);
    }
  };

  /* TOGGLE TASK */

  const toggleTask = async (id) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/todos/${id}`);

      setTasks(tasks.map((item) => (item._id === id ? res.data : item)));
    } catch (error) {
      console.log(error);
    }
  };

  /* DELETE TASK */

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/todos/${id}`);

      setTasks(tasks.filter((item) => item._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="todo-card">
      {/* HEADER */}

      <div className="todo-header">
        <span>☑️</span>

        <h1>Todo List</h1>
      </div>

      {/* INPUTS */}

      <div className="todo-form">
        {/* TASK */}

        <input
          type="text"
          placeholder="Enter task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* TYPE */}

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Select Type</option>

          <option value="Daily">Daily</option>

          <option value="Weekly">Weekly</option>

          <option value="Monthly">Monthly</option>

          <option value="Yearly">Yearly</option>
        </select>

        {/* DATE */}

        <input
          type="date"
          value={completionDate}
          onChange={(e) => setCompletionDate(e.target.value)}
        />

        {/* BUTTON */}

        <button onClick={addTask}>Add Task</button>
      </div>

      {/* TASKS */}

      <div className="todo-tasks">
        {tasks.map((item) => (
          <div
            key={item._id}
            className={`todo-task ${item.completed ? "completed" : ""}`}
          >
            {/* LEFT */}

            <div className="task-left">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleTask(item._id)}
              />

              <div>
                <h3>{item.text}</h3>

                <p>
                  {item.type} •{" "}
                  {new Date(item.completionDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* DELETE */}

            <button className="delete-btn" onClick={() => deleteTask(item._id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER */}

      <div className="todo-footer">
        <p>{tasks.filter((item) => !item.completed).length} tasks remaining</p>
      </div>
    </div>
  );
};

export default Todo;
