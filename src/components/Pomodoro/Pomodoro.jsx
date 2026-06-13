import { useEffect, useState } from "react";
import "./Pomodoro.css";
import axios from "axios";

const Pomodoro = () => {
  const [label, setLabel] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [sessionId, setSessionId] = useState(null);

  const [customMode, setCustomMode] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    // fetch existing sessions count
    const fetchSessions = async () => {
      try {
        const res = await axios.get(
          "https://my-server-1-nvrv.onrender.com/api/pomodoros",
        );

        if (Array.isArray(res.data)) setSessions(res.data.length);
      } catch (error) {
        console.error("Failed to fetch pomodoro sessions:", error);
      }
    };

    fetchSessions();
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
      // mark session complete on server
      if (sessionId) {
        axios
          .patch(
            `https://my-server-1-nvrv.onrender.com/api/pomodoros/${sessionId}/complete`,
          )
          .catch((err) => console.error("Complete session failed", err));
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

    if (part === "h") h = Number(value);
    if (part === "m") m = Number(value);
    if (part === "s") s = Number(value);

    setTimeLeft(h * 3600 + m * 60 + s);
  };

  const setTimerMode = (mode) => {
    if (!isRunning) {
      setLabel(mode);
    }
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-card">
        <h1 className="title">🕒 Pomodoro Timer</h1>

        {/* Timer + Input */}

        <div className="timer-editor">
          <select
            value={hrs}
            disabled={isRunning}
            onChange={(e) => updateTime("h", e.target.value)}
          >
            {[...Array(24)].map((_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}
              </option>
            ))}
          </select>

          <span>:</span>

          <select
            value={mins}
            disabled={isRunning}
            onChange={(e) => updateTime("m", e.target.value)}
          >
            {[...Array(60)].map((_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}
              </option>
            ))}
          </select>

          <span>:</span>

          <select
            value={secs}
            disabled={isRunning}
            onChange={(e) => updateTime("s", e.target.value)}
          >
            {[...Array(60)].map((_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        <p className="status">{label || "Select mode"}</p>

        {/* Buttons */}

        <div className="buttons">
          <button
            className="start"
            onClick={async () => {
              if (timeLeft > 0) {
                setIsRunning(true);

                try {
                  if (!sessionId) {
                    const res = await axios.post(
                      "https://my-server-1-nvrv.onrender.com/api/pomodoros",
                      {
                        label: label || "",
                        timeLeft,
                        duration: timeLeft,
                      },
                    );

                    const id = res.data._id || res.data.id;
                    setSessionId(id);
                  } else {
                    await axios.patch(
                      `https://my-server-1-nvrv.onrender.com/api/pomodoros/${sessionId}/start`,
                    );
                  }
                } catch (error) {
                  console.error("Failed to start session:", error);
                }
              }
            }}
          >
            Start
          </button>

          <button
            className="pause"
            onClick={async () => {
              setIsRunning(false);

              if (sessionId) {
                try {
                  await axios.patch(
                    `https://my-server-1-nvrv.onrender.com/api/pomodoros/${sessionId}/pause`,
                  );
                } catch (error) {
                  console.error("Failed to pause session:", error);
                }
              }
            }}
          >
            Pause
          </button>

          <button
            className="reset"
            onClick={async () => {
              setTimeLeft(1500);
              setIsRunning(false);

              if (sessionId) {
                try {
                  await axios.patch(
                    `https://my-server-1-nvrv.onrender.com/api/pomodoros/${sessionId}/reset`,
                  );
                } catch (error) {
                  console.error("Failed to reset session:", error);
                }
              }
            }}
          >
            Reset
          </button>
        </div>

        <div className="modes">
          <button disabled={isRunning} onClick={() => setTimerMode("Work")}>
            Work
          </button>

          <button disabled={isRunning} onClick={() => setTimerMode("Study")}>
            Study
          </button>

          <button disabled={isRunning} onClick={() => setTimerMode("Break")}>
            Break
          </button>
        </div>

        <div className="custom-mode">
          <input
            type="text"
            value={customMode}
            placeholder="Custom Mode"
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
          >
            {isEditing ? "Set" : "Edit"}
          </button>
        </div>

        <p className="sessions">
          🎃 Sessions completed:
          <span> {sessions}</span>
        </p>
      </div>
    </div>
  );
};

export default Pomodoro;
