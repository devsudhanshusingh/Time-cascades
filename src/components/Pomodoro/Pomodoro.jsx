import { useEffect, useState } from "react";
import api from "../../api";
import "./Pomodoro.css";

const Pomodoro = () => {
  const [label, setLabel] = useState("Work");
  const [timeLeft, setTimeLeft] = useState(1500); // 25 min default
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [sessionId, setSessionId] = useState(null);

  const [customMode, setCustomMode] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/api/pomodoros")
      .then((res) => {
        if (active && Array.isArray(res.data)) {
          setSessions(res.data.length);
        }
      })
      .catch((error) => {
        console.log("Using local pomodoro session counter", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let timer;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && isRunning) {
      setTimeout(() => {
        setIsRunning(false);
        setSessions((prev) => prev + 1);
      }, 0);

      if (sessionId) {
        api
          .patch(`/api/pomodoros/${sessionId}/complete`)
          .catch((err) => console.log("Complete session failed", err));
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, sessionId]);

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  const updateTime = (part, value) => {
    if (isRunning) return;

    let h = hrs;
    let m = mins;
    let s = secs;

    const numVal = Math.max(0, Number(value) || 0);

    if (part === "h") h = Math.min(23, numVal);
    if (part === "m") m = Math.min(59, numVal);
    if (part === "s") s = Math.min(59, numVal);

    setTimeLeft(h * 3600 + m * 60 + s);
  };

  const setTimerMode = (mode) => {
    if (!isRunning) {
      setLabel(mode);
      if (mode === "Work" || mode === "Study") {
        setTimeLeft(1500); // 25 min
      } else if (mode === "Break") {
        setTimeLeft(300); // 5 min
      }
    }
  };

  const handleStart = async () => {
    if (timeLeft <= 0) return;
    setIsRunning(true);

    try {
      if (!sessionId) {
        const res = await api.post("/api/pomodoros", {
          label: label || "Focus Session",
          timeLeft,
          duration: timeLeft,
        });

        const id = res.data?._id || res.data?.id;
        if (id) setSessionId(id);
      } else {
        await api.patch(`/api/pomodoros/${sessionId}/start`);
      }
    } catch (error) {
      console.log("Start session API offline, running locally", error);
    }
  };

  const handlePause = async () => {
    setIsRunning(false);

    if (sessionId) {
      try {
        await api.patch(`/api/pomodoros/${sessionId}/pause`);
      } catch (error) {
        console.log("Pause session API failed", error);
      }
    }
  };

  const handleReset = async () => {
    setIsRunning(false);
    setTimeLeft(1500);
    setLabel("Work");

    if (sessionId) {
      try {
        await api.patch(`/api/pomodoros/${sessionId}/reset`);
      } catch (error) {
        console.log("Reset session API failed", error);
      }
    }
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-card">
        <h1 className="title">⏱️ Pomodoro Timer</h1>

        <div className="timer-editor" title="Type numbers or scroll inside to change time">
          <div className="timer-input-box">
            <input
              type="number"
              min="0"
              max="23"
              value={String(hrs).padStart(2, "0")}
              disabled={isRunning}
              onChange={(e) => updateTime("h", e.target.value)}
              onWheel={(e) => {
                if (isRunning) return;
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1 : -1;
                updateTime("h", (hrs + delta + 24) % 24);
              }}
              aria-label="Hours"
            />
          </div>

          <span className="colon">:</span>

          <div className="timer-input-box">
            <input
              type="number"
              min="0"
              max="59"
              value={String(mins).padStart(2, "0")}
              disabled={isRunning}
              onChange={(e) => updateTime("m", e.target.value)}
              onWheel={(e) => {
                if (isRunning) return;
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1 : -1;
                updateTime("m", (mins + delta + 60) % 60);
              }}
              aria-label="Minutes"
            />
          </div>

          <span className="colon">:</span>

          <div className="timer-input-box">
            <input
              type="number"
              min="0"
              max="59"
              value={String(secs).padStart(2, "0")}
              disabled={isRunning}
              onChange={(e) => updateTime("s", e.target.value)}
              onWheel={(e) => {
                if (isRunning) return;
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1 : -1;
                updateTime("s", (secs + delta + 60) % 60);
              }}
              aria-label="Seconds"
            />
          </div>
        </div>

        <p className="status">{label || "Focus Session"}</p>

        <div className="buttons">
          <button className="start" onClick={handleStart} type="button">
            {isRunning ? "Running..." : "Start"}
          </button>

          <button className="pause" onClick={handlePause} type="button">
            Pause
          </button>

          <button className="reset" onClick={handleReset} type="button">
            Reset
          </button>
        </div>

        <div className="modes">
          <button
            disabled={isRunning}
            className={label === "Work" ? "active" : ""}
            onClick={() => setTimerMode("Work")}
            type="button"
          >
            Work
          </button>

          <button
            disabled={isRunning}
            className={label === "Study" ? "active" : ""}
            onClick={() => setTimerMode("Study")}
            type="button"
          >
            Study
          </button>

          <button
            disabled={isRunning}
            className={label === "Break" ? "active" : ""}
            onClick={() => setTimerMode("Break")}
            type="button"
          >
            Break
          </button>
        </div>

        <div className="custom-mode">
          <input
            type="text"
            value={customMode}
            placeholder="Custom Mode..."
            disabled={!isEditing || isRunning}
            onChange={(e) => setCustomMode(e.target.value)}
          />

          <button
            disabled={isRunning}
            onClick={() => {
              if (isEditing) {
                if (customMode.trim()) {
                  setLabel(customMode);
                  setIsEditing(false);
                }
              } else {
                setIsEditing(true);
              }
            }}
            type="button"
          >
            {isEditing ? "Set" : "Edit"}
          </button>
        </div>

        <p className="sessions">
          🔥 Sessions completed: <span>{sessions}</span>
        </p>
      </div>
    </div>
  );
};

export default Pomodoro;
