import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./DailyTasks.css";

const taskModes = ["Daily", "Weekly", "Monthly", "Yearly"];

const calendarModes = ["Day", "Week", "Month", "Year"];

const dateKey = (date = new Date()) =>
  new Date(date).toISOString().split("T")[0];

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);

  const [taskText, setTaskText] = useState("");

  const [taskType, setTaskType] = useState("Daily");

  const [calendarMode, setCalendarMode] = useState("Day");

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
    return tasks.filter(
      (task) =>
        task.type === taskType && dateKey(task.completionDate) === dateKey(),
    );
  }, [tasks, taskType]);

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

        completionDate: dateKey(),
      });

      setTasks((prev) => [res.data, ...prev]);

      setTaskText("");
    } catch (err) {
      setError(err?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = async (task) => {
    try {
      await api.put(`/api/todos/complete/${task._id}`);

      await fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  const getCalendarItems = () => {
    let arr = [];

    let now = new Date();

    let total =
      calendarMode === "Day"
        ? 30
        : calendarMode === "Week"
          ? 12
          : calendarMode === "Month"
            ? 12
            : 10;

    for (let i = 0; i < total; i++) {
      let d = new Date(now);

      if (calendarMode === "Day") d.setDate(now.getDate() + i);

      if (calendarMode === "Week") d.setDate(now.getDate() + i * 7);

      if (calendarMode === "Month") d.setMonth(now.getMonth() + i);

      if (calendarMode === "Year") d.setFullYear(now.getFullYear() + i);

      arr.push(d);
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

        <button className="dt-refresh-btn" onClick={fetchTasks}>
          Refresh
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
              <label
                key={task._id}
                className={task.completed ? "dt-task completed" : "dt-task"}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleCompletion(task)}
                />

                <div>
                  <span>{task.text}</span>

                  <p className="task-type">{task.type}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="dt-calendar-section">
          <div className="dt-section-heading">
            <h3>Calendar</h3>

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

          <div className="dt-calendar">
            {getCalendarItems().map((date) => {
              const data = getCalendarData(date);

              return (
                <div key={dateKey(date)} className="dt-calendar-day">
                  <span className="day-date">{date.toDateString()}</span>

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
