// Todo.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Todo.css";

const Todo = () => {
  const [text, setText] = useState("");
  const [type, setType] = useState("Daily");
  const [completionDate, setCompletionDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [showTasks, setShowTasks] = useState(false);

  const getDateInputType = (mode) => {
    switch (mode) {
      case "Weekly":
        return "week";

      case "Monthly":
        return "month";

      case "Yearly":
        return "number";

      default:
        return "date";
    }
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 20 }, (_, index) => currentYear - 5 + index);
  };

  const formatCompletionDate = (item) => {
    if (!item?.completionDate) return "";

    const value = item.completionDate;

    switch (item.type) {
      case "Weekly": {
        const [year, week] = value.split("-W");

        return week ? `Week ${week}, ${year}` : value;
      }

      case "Monthly": {
        const [year, month] = value.split("-");

        if (year && month) {
          const date = new Date(`${year}-${month}-01`);

          return date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
        }

        return value;
      }

      case "Yearly":
        return value;

      default: {
        const date = new Date(value);

        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
      }
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await axios.get(
        "https://my-server-1-nvrv.onrender.com/api/todos",
      );

      setTasks(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTask = async () => {
    if (!text.trim() || !completionDate) return;

    try {
      const res = await axios.post(
        "https://my-server-1-nvrv.onrender.com/api/todos",
        {
          type,
          text,
          completionDate,
        },
      );

      setTasks([res.data, ...tasks]);

      setText("");
      setCompletionDate("");
      setType("Daily");
    } catch (error) {
      console.log(error);
    }
  };

  const toggleTask = async (id) => {
    try {
      const res = await axios.patch(
        `https://my-server-1-nvrv.onrender.com/api/todos/${id}`,
      );

      setTasks(tasks.map((item) => (item._id === id ? res.data : item)));
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(
        `https://my-server-1-nvrv.onrender.com/api/todos/${id}`,
      );

      setTasks(tasks.filter((item) => item._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  const filteredTasks = tasks.filter((item) => item.type === type);

  return (
    <div className={`todo-card ${showTasks ? "flipped" : ""}`}>
      <div className="todo-card-inner">
        {/* FRONT */}

        <div className="todo-card-face todo-card-front">
          <div className="todo-header">
            <span>☑️</span>

            <h1>Todo List</h1>
          </div>

          <div className="todo-form">
            <div className="mode-buttons">
              {["Daily", "Weekly", "Monthly", "Yearly"].map((mode) => (
                <button
                  key={mode}
                  className={`mode-button ${type === mode ? "active" : ""}`}
                  onClick={() => {
                    setType(mode);

                    setCompletionDate("");
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="input-box">
              <span className="input-icon">📝</span>

              <input
                type="text"
                placeholder="Enter task..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="input-box">
              <span className="input-icon">📅</span>

              {type === "Yearly" ? (
                <select
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                >
                  <option value="">Select year</option>

                  {getYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="date-input"
                  type={getDateInputType(type)}
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
              )}
            </div>

            <div className="form-actions">
              <button onClick={addTask}>Add Task</button>

              <button
                className="view-tasks-btn"
                onClick={() => setShowTasks(true)}
              >
                View Tasks
              </button>
            </div>
          </div>
        </div>

        {/* BACK */}

        <div className="todo-card-face todo-card-back">
          <div className="todo-back-header">
            <span>Task List</span>

            <button
              className="view-tasks-btn back"
              onClick={() => setShowTasks(false)}
            >
              Back
            </button>
          </div>

          <div className="todo-tasks-panel">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((item) => (
                <div
                  key={item._id}
                  className={`todo-task ${item.completed ? "completed" : ""}`}
                >
                  <div className="task-left">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleTask(item._id)}
                    />

                    <div>
                      <h3>{item.text}</h3>

                      <p>
                        {item.type}
                        {" • "}
                        {formatCompletionDate(item)}
                      </p>
                    </div>
                  </div>

                  <button
                    className="delete-btn"
                    onClick={() => deleteTask(item._id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">No tasks available</div>
            )}
          </div>

          <div className="todo-footer">
            <p>
              {filteredTasks.filter((item) => !item.completed).length} tasks
              remaining
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Todo;
