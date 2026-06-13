import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./DailyTasks.css";

const completionStorageKey = "timeCascadesDailyTaskCompletions";
const taskModes = ["Daily", "Weekly", "Monthly", "Yearly"];
const calendarModes = ["Day", "Week", "Month", "Year"];

const dateKey = (date = new Date()) => date.toISOString().split("T")[0];
const getTaskId = (task) => task?._id || task?.id;

const readStoredCompletions = () => {
  try {
    return JSON.parse(localStorage.getItem(completionStorageKey)) || {};
  } catch {
    return {};
  }
};

const parseTaskStart = (task) => {
  if (!task?.completionDate) return new Date();

  if (task.type === "Yearly") {
    return new Date(Number(task.completionDate), 0, 1);
  }

  if (task.type === "Monthly") {
    return new Date(`${task.completionDate}-01`);
  }

  if (task.type === "Weekly") {
    const [year, week] = String(task.completionDate).split("-W");
    const weekStart = new Date(Number(year), 0, 1);
    weekStart.setDate(weekStart.getDate() + (Number(week || 1) - 1) * 7);
    return weekStart;
  }

  return new Date(task.completionDate);
};

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [taskType, setTaskType] = useState("Daily");
  const [calendarMode, setCalendarMode] = useState("Day");
  const [hoveredDate, setHoveredDate] = useState(null);
  const [completions, setCompletions] = useState(readStoredCompletions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/todos");
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not load daily tasks. Please refresh after login.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchTasks, 0);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    localStorage.setItem(completionStorageKey, JSON.stringify(completions));
  }, [completions]);

  const isTaskRelevantForDate = useCallback((task, targetDate) => {
    const start = parseTaskStart(task);
    const date = new Date(targetDate);

    if (Number.isNaN(start.getTime()) || date < start) return false;
    if (task.type === "Daily") return true;
    if (task.type === "Weekly") return start.getDay() === date.getDay();
    if (task.type === "Monthly") return start.getDate() === date.getDate();

    if (task.type === "Yearly") {
      return (
        start.getDate() === date.getDate() &&
        start.getMonth() === date.getMonth()
      );
    }

    return false;
  }, []);

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.type === taskType && isTaskRelevantForDate(task, new Date()),
      ),
    [isTaskRelevantForDate, taskType, tasks],
  );

  const completedToday = useMemo(() => {
    const today = dateKey();
    const completedIds = completions[today] || [];
    return visibleTasks.filter((task) => completedIds.includes(getTaskId(task))).length;
  }, [completions, visibleTasks]);

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();

    for (let i = 0; i < 365; i++) {
      const key = dateKey(cursor);
      const dayTasks = tasks.filter(
        (task) => task.type === taskType && isTaskRelevantForDate(task, cursor),
      );
      const completedIds = completions[key] || [];

      if (
        dayTasks.length > 0 &&
        dayTasks.every((task) => completedIds.includes(getTaskId(task)))
      ) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return count;
  }, [completions, isTaskRelevantForDate, taskType, tasks]);

  const addTask = async () => {
    const text = taskText.trim();
    if (!text) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/todos", {
        text,
        type: taskType,
        completionDate: dateKey(),
      });

      setTasks((current) => [res.data, ...current]);
      setTaskText("");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create task.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCompletion = (id, targetDate) => {
    setCompletions((current) => {
      const old = current[targetDate] || [];
      const nextForDate = old.includes(id)
        ? old.filter((taskId) => taskId !== id)
        : [...old, id];

      return {
        ...current,
        [targetDate]: nextForDate,
      };
    });
  };

  const getCalendarItems = () => {
    const items = [];
    const now = new Date();
    const total =
      calendarMode === "Day" ? 30 : calendarMode === "Week" ? 12 : calendarMode === "Month" ? 12 : 10;

    for (let index = 0; index < total; index++) {
      const date = new Date(now);

      if (calendarMode === "Day") date.setDate(now.getDate() + index);
      if (calendarMode === "Week") date.setDate(now.getDate() + index * 7);
      if (calendarMode === "Month") date.setMonth(now.getMonth() + index, 1);
      if (calendarMode === "Year") date.setFullYear(now.getFullYear() + index, 0, 1);

      items.push(date);
    }

    return items;
  };

  const getCompletion = (targetDate) => {
    const key = dateKey(targetDate);
    const completed = completions[key] || [];
    const filteredTasks = tasks.filter(
      (task) => task.type === taskType && isTaskRelevantForDate(task, targetDate),
    );

    return {
      completed: filteredTasks.filter((task) => completed.includes(getTaskId(task))).length,
      total: filteredTasks.length,
    };
  };

  return (
    <section className="daily-tasks-card">
      <div className="dt-header">
        <div className="dt-icon" aria-hidden="true">
          ✓
        </div>
        <div>
          <p className="dt-kicker">Authenticated todos</p>
          <h1>Daily Tasks</h1>
          <p className="streak">Current streak: {streak} days</p>
        </div>
        <button className="dt-refresh-btn" onClick={fetchTasks} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="dt-form">
        <div className="mode-buttons" aria-label="Task frequency">
          {taskModes.map((mode) => (
            <button
              key={mode}
              className={taskType === mode ? "mode-button active" : "mode-button"}
              onClick={() => setTaskType(mode)}
              type="button"
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="dt-add-row">
          <div className="input-box">
            <span className="input-icon">✎</span>
            <input
              placeholder="Enter task..."
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addTask()}
              disabled={loading}
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
            <h3>Today</h3>
            <span>
              {completedToday}/{visibleTasks.length}
            </span>
          </div>

          <div className="dt-tasks-list">
            {visibleTasks.length ? (
              visibleTasks.map((task) => {
                const id = getTaskId(task);
                const today = dateKey();
                const done = (completions[today] || []).includes(id);

                return (
                  <label key={id} className={done ? "dt-task completed" : "dt-task"}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleCompletion(id, today)}
                      disabled={loading}
                    />
                    <div>
                      <span>{task.text || task.title || "Untitled task"}</span>
                      <p className="task-type">{task.type || "Daily"}</p>
                    </div>
                  </label>
                );
              })
            ) : (
              <div className="empty-state">
                {loading ? "Loading tasks..." : "No tasks for today"}
              </div>
            )}
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
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="dt-calendar">
            {getCalendarItems().map((date) => {
              const key = dateKey(date);
              const data = getCompletion(date);
              const isToday = key === dateKey();
              const dayTasks = tasks.filter(
                (task) => task.type === taskType && isTaskRelevantForDate(task, date),
              );

              return (
                <div
                  key={key}
                  className={`dt-calendar-day ${isToday ? "today" : ""}`}
                  onMouseEnter={() => setHoveredDate(key)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <span className="day-date">
                    {date.toLocaleDateString("en-US", {
                      day: calendarMode === "Year" ? undefined : "2-digit",
                      month: calendarMode === "Day" || calendarMode === "Week" ? "short" : "short",
                      year: calendarMode === "Year" ? "numeric" : undefined,
                      weekday: calendarMode === "Day" || calendarMode === "Week" ? "short" : undefined,
                    })}
                  </span>
                  <span className="completion-info">
                    {data.completed}/{data.total}
                  </span>

                  {hoveredDate === key && dayTasks.length > 0 && (
                    <div className="dt-date-menu">
                      {dayTasks.map((task) => {
                        const id = getTaskId(task);
                        const isCompleted = (completions[key] || []).includes(id);

                        return (
                          <label key={id} className="preview-task">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleCompletion(id, key)}
                            />
                            <span>{task.text || task.title || "Untitled task"}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
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
