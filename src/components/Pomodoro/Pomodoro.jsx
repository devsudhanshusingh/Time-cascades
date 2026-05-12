import React, { useEffect, useState } from "react";
import "./Pomodoro.css";

const Pomodoro = () => {
  const [label, setLabel] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // Time Inputs
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  // Custom Mode
  const [customMode, setCustomMode] = useState("");
  const [isCustomAdded, setIsCustomAdded] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    let timer;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessions((prev) => prev + 1);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Format Timer
  const formatTime = () => {
    const hrs = Math.floor(timeLeft / 3600);
    const mins = Math.floor((timeLeft % 3600) / 60);
    const secs = timeLeft % 60;

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  };

  // Total Seconds
  const calculateTotalSeconds = () => {
    return (
      Number(hours || 0) * 3600 +
      Number(minutes || 0) * 60 +
      Number(seconds || 0)
    );
  };

  // Modes
  const setTimerMode = (name) => {
    setLabel(name);
    setIsRunning(false);
  };

  return (
    <div className="pomodoro-container">
      <div className="pomodoro-card">
        <h1 className="title">🕒 Pomodoro Timer</h1>

        {/* Timer */}

        <h2 className="timer">{formatTime()}</h2>

        {/* Mode Label */}

        <p className="status">{label || "Select a mode"}</p>

        {/* Time Inputs */}

        <div className="time-editor">
          <input
            type="number"
            placeholder="HH"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />

          <input
            type="number"
            placeholder="MM"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />

          <input
            type="number"
            placeholder="SS"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
          />
        </div>

        {/* Buttons */}

        <div className="buttons">
          <button
            className="start"
            onClick={() => {
              if (!timeLeft) {
                setTimeLeft(calculateTotalSeconds());
              }

              setIsRunning(true);
            }}
          >
            Start
          </button>

          <button className="pause" onClick={() => setIsRunning(false)}>
            Pause
          </button>

          <button
            className="reset"
            onClick={() => {
              setTimeLeft(calculateTotalSeconds());
              setIsRunning(false);
            }}
          >
            Reset
          </button>
        </div>

        {/* Default Modes */}

        <div className="modes">
          <button onClick={() => setTimerMode("Work")}>Work</button>

          <button onClick={() => setTimerMode("Study")}>Study</button>

          <button onClick={() => setTimerMode("Break")}>Break</button>
        </div>

        {/* Custom Mode */}

        <div className="custom-mode">
          <input
            type="text"
            placeholder="Custom Mode"
            value={customMode}
            disabled={!isEditing}
            onChange={(e) => setCustomMode(e.target.value)}
          />

          <button
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
            {isEditing ? "Submit" : "Edit"}
          </button>
        </div>

        {/* Sessions */}

        <p className="sessions">
          🍅 Sessions completed: <span>{sessions}</span>
        </p>
      </div>
    </div>
  );
};

export default Pomodoro;
