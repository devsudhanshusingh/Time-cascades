import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./DailyTasks.css";

const taskModes = ["Daily", "Weekly", "Monthly", "Yearly"];

const calendarModes = ["Day", "Week", "Month", "Year"];

const dateKey = (date = new Date()) => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const DailyTasks = () => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editText, setEditText] = useState("");
  const [tasks, setTasks] = useState([]);

  const [taskText, setTaskText] = useState("");

  const [taskType, setTaskType] = useState("Daily");

  const [calendarMode, setCalendarMode] = useState("Day");
  const [calendarOffset, setCalendarOffset] = useState(0);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/todos");

      setTasks(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 0);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  // today's selected tasks

  const visibleTasks = useMemo(() => {
    const selected = new Date(selectedDate);

    return tasks.filter((task) => {
      if (task.type !== taskType) return false;

      const taskDate = new Date(task.completionDate);

      // DAY
      if (calendarMode === "Day") {
        return dateKey(taskDate) === dateKey(selected);
      }

      // WEEK (Monday → Sunday)
      if (calendarMode === "Week") {
        const monday = new Date(selected);
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;

        monday.setDate(monday.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return taskDate >= monday && taskDate <= sunday;
      }

      // MONTH
      if (calendarMode === "Month") {
        return (
          taskDate.getMonth() === selected.getMonth() &&
          taskDate.getFullYear() === selected.getFullYear()
        );
      }

      // YEAR
      if (calendarMode === "Year") {
        return taskDate.getFullYear() === selected.getFullYear();
      }

      return false;
    });
  }, [tasks, taskType, selectedDate, calendarMode]);

  const completedToday = visibleTasks.filter((task) => task.completed).length;

  const streak = useMemo(() => {
    let count = 0;

    let current = new Date();

    while (true) {
      const key = dateKey(current);

      const dayTasks = tasks.filter(
        (task) =>
          task.type === taskType && dateKey(task.completionDate) === key,
      );

      if (dayTasks.length && dayTasks.every((task) => task.completed)) {
        count++;

        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [tasks, taskType]);

  const addTask = async () => {
    const text = taskText.trim();

    if (!text) return;

    try {
      setLoading(true);

      const res = await api.post("/api/todos", {
        text,

        type: taskType,

        completionDate: new Date(),
      });

      setTasks((prev) => [res.data, ...prev]);

      setTaskText("");
    } catch (err) {
      setError(err?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const copyTasks = async () => {
    try {
      setLoading(true);

      await api.post("/api/todos/copy", {
        type: taskType,
      });
    } catch (err) {
      setError(err?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const editTask = async (taskId) => {
    try {
      const res = await api.put(`/api/todos/edit/${taskId}`, {
        text: editText,
      });

      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? res.data : task)),
      );

      setEditingTaskId(null);
      setEditText("");
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/api/todos/${taskId}`);

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (error) {
      console.log(error);
    }
  };

  const MIN_YEAR = 2026;
  const MIN_MONTH = 5; // June

  const getCalendarItems = () => {
    const arr = [];
    const baseDate = new Date();

    // DAY (real month calendar)
    if (calendarMode === "Day") {
      baseDate.setMonth(baseDate.getMonth() + calendarOffset);

      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Monday start
      let startDay = firstDay.getDay();
      startDay = startDay === 0 ? 6 : startDay - 1;

      // Empty cells before month starts
      for (let i = 0; i < startDay; i++) {
        arr.push(null);
      }

      // Real month days
      for (let day = 1; day <= lastDay.getDate(); day++) {
        arr.push(new Date(year, month, day));
      }
    }

    // WEEK (Monday → Sunday)
    if (calendarMode === "Week") {
      const today = new Date();
      today.setDate(today.getDate() + calendarOffset * 7);

      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        arr.push(d);
      }
    }

    // MONTH
    if (calendarMode === "Month") {
      const year = new Date().getFullYear();

      for (let i = 0; i < 12; i++) {
        arr.push(new Date(year, i, 1));
      }
    }

    // YEAR
    if (calendarMode === "Year") {
      for (let i = MIN_YEAR; i <= MIN_YEAR + 20; i++) {
        arr.push(new Date(i, 0, 1));
      }
    }

    return arr;
  };

  const getCalendarData = (date) => {
    const key = dateKey(date);

    const dayTasks = tasks.filter(
      (task) => task.type === taskType && dateKey(task.completionDate) === key,
    );

    return {
      total: dayTasks.length,

      completed: dayTasks.filter((task) => task.completed).length,
    };
  };

  return (
    <section className="daily-tasks-card">
      <div className="dt-header">
        <div className="dt-icon">✓</div>

        <div>
          <h1>Daily Tasks</h1>

          <p className="streak">Streak: {streak} days</p>
        </div>

        <button className="dt-copy-btn" onClick={copyTasks}>
          Copy{" "}
          {taskType === "Daily"
            ? "yesterday"
            : taskType === "Weekly"
              ? "Previous Week"
              : taskType === "Monthly"
                ? "Previous Month"
                : "Previous Year"}{" "}
          Tasks
        </button>
      </div>

      <div className="dt-form">
        <div className="mode-buttons">
          {taskModes.map((mode) => (
            <button
              key={mode}
              className={
                taskType === mode ? "mode-button active" : "mode-button"
              }
              onClick={() => setTaskType(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="dt-add-row">
          <div className="input-box">
            <input
              placeholder="Enter task..."
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
          </div>

          <button className="dt-add-btn" onClick={addTask} disabled={loading}>
            {loading ? "Saving..." : "Add Task"}
          </button>
        </div>

        {error && <p className="dt-error">{error}</p>}
      </div>

      <div className="dt-content-grid">
        <div className="dt-today-section">
          <div className="dt-section-heading">
            <h3>{taskType}</h3>

            <span>
              {completedToday}/{visibleTasks.length}
            </span>
          </div>

          <div className="dt-tasks-list">
            {visibleTasks.map((task) => (
              <div
                key={task._id}
                className={task.completed ? "dt-task completed" : "dt-task"}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleCompletion(task)}
                />

                <div className="task-content">
                  {editingTaskId === task._id ? (
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  ) : (
                    <>
                      <span>{task.text}</span>
                      <p className="task-type">{task.type}</p>
                    </>
                  )}
                </div>

                <div className="task-actions">
                  {editingTaskId === task._id ? (
                    <>
                      <button onClick={() => editTask(task._id)}>Save</button>

                      <button
                        onClick={() => {
                          setEditingTaskId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingTaskId(task._id);
                          setEditText(task.text);
                        }}
                      >
                        Edit
                      </button>

                      <button onClick={() => deleteTask(task._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dt-calendar-section">
          <div className="dt-section-heading">
            <div className="calendar-nav">
              <button
                onClick={() =>
                  setCalendarOffset((prev) => {
                    const current = new Date();

                    current.setMonth(current.getMonth() + prev - 1);

                    if (
                      current.getFullYear() < MIN_YEAR ||
                      (current.getFullYear() === MIN_YEAR &&
                        current.getMonth() < MIN_MONTH)
                    ) {
                      return prev;
                    }

                    return prev - 1;
                  })
                }
              >
                ←
              </button>

              <h3>Calendar</h3>

              <button onClick={() => setCalendarOffset((prev) => prev + 1)}>
                →
              </button>
            </div>

            <div className="calendar-switch">
              {calendarModes.map((mode) => (
                <button
                  key={mode}
                  className={calendarMode === mode ? "active" : ""}
                  onClick={() => setCalendarMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          {calendarMode === "Day" && (
            <div className="calendar-weekdays">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          )}
          <div className="dt-calendar">
            {getCalendarItems().map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={index}
                    className="dt-calendar-day empty-calendar-day"
                  />
                );
              }
              const data = getCalendarData(date);

              return (
                <div
                  key={dateKey(date)}
                  className={
                    dateKey(date) === dateKey(selectedDate)
                      ? "dt-calendar-day active"
                      : "dt-calendar-day"
                  }
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="day-date">
                    {calendarMode === "Day" &&
                      date.toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}

                    {calendarMode === "Week" &&
                      (() => {
                        const monday = new Date(date);
                        const day = monday.getDay();
                        const diff = day === 0 ? -6 : 1 - day;

                        monday.setDate(monday.getDate() + diff);

                        const sunday = new Date(monday);
                        sunday.setDate(monday.getDate() + 6);

                        return `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`;
                      })()}

                    {calendarMode === "Month" &&
                      date.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}

                    {calendarMode === "Year" && date.getFullYear()}
                  </span>

                  <span className="completion-info">
                    {data.completed}/{data.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyTasks;
