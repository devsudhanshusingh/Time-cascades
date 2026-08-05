import { useState, useEffect, useCallback } from "react";
import { getTodayRoutine, logRoutineProgress, getRoutineStats } from "../englishApi";
import "./Routine.css";

const defaultRoutineTasks = [
  { id: "reading", title: "Reading Practice", duration: 10, durationSec: 600, icon: "📖", desc: "Read an article or book chapter in English." },
  { id: "vocabulary", title: "Vocabulary Drill", duration: 5, durationSec: 300, icon: "🎴", desc: "Review 10 flashcards and learn 3 new words." },
  { id: "spelling", title: "Spelling & Grammar", duration: 5, durationSec: 300, icon: "✍️", desc: "Practice difficult spellings and sentence structures." },
  { id: "writing", title: "Journal Writing", duration: 5, durationSec: 300, icon: "📝", desc: "Write a short 50-word paragraph in your journal." },
  { id: "speaking", title: "Speaking Out Loud", duration: 5, durationSec: 300, icon: "🎙️", desc: "Speak out loud for 5 minutes summarizing your day." },
];

const RoutineView = ({ showToast }) => {
  const [completedTaskIds, setCompletedTaskIds] = useState(["reading", "vocabulary"]);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(defaultRoutineTasks[0].durationSec);
  const [isRunning, setIsRunning] = useState(false);
  const [streakStats, setStreakStats] = useState({ currentStreak: 5, longestStreak: 12 });

  const currentTask = defaultRoutineTasks[activeTaskIndex] || defaultRoutineTasks[0];

  useEffect(() => {
    getTodayRoutine()
      .then((data) => {
        if (data?.reading) {
          const done = [];
          if (data.reading.completed) done.push("reading");
          if (data.vocabulary?.completed) done.push("vocabulary");
          if (data.spelling?.completed) done.push("spelling");
          if (data.writing?.completed) done.push("writing");
          if (data.speaking?.completed) done.push("speaking");
          setCompletedTaskIds(done);
        }
      })
      .catch((err) => {
        console.log("Using local routine fallback", err);
      });

    getRoutineStats()
      .then((stats) => {
        if (stats?.currentStreak !== undefined) {
          setStreakStats({
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak || 12,
          });
        }
      })
      .catch(() => {});
  }, []);

  const syncRoutineToApi = useCallback((newCompletedIds) => {
    const payload = {
      date: new Date().toISOString().split("T")[0],
      reading: { completed: newCompletedIds.includes("reading"), timeSpent: 15 },
      vocabulary: { completed: newCompletedIds.includes("vocabulary"), timeSpent: 20 },
      spelling: { completed: newCompletedIds.includes("spelling"), timeSpent: 10 },
      writing: { completed: newCompletedIds.includes("writing"), timeSpent: 5 },
      speaking: { completed: newCompletedIds.includes("speaking"), timeSpent: 5 },
    };

    logRoutineProgress(payload).catch((err) => {
      console.log("Routine progress logged locally fallback", err);
    });
  }, []);

  const toggleTaskComplete = useCallback(
    (id) => {
      let updated;
      if (completedTaskIds.includes(id)) {
        updated = completedTaskIds.filter((tId) => tId !== id);
      } else {
        updated = [...completedTaskIds, id];
        showToast?.(`Marked "${id}" complete!`, "success");
      }
      setCompletedTaskIds(updated);
      syncRoutineToApi(updated);
    },
    [completedTaskIds, showToast, syncRoutineToApi]
  );

  // Timer Effect
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setTimeout(() => {
        setIsRunning(false);
        showToast?.(`Completed step: ${currentTask.title}!`, "success");
        toggleTaskComplete(currentTask.id);
      }, 0);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, currentTask, showToast, toggleTaskComplete]);

  const handleSelectTask = (idx) => {
    setActiveTaskIndex(idx);
    setTimeLeft(defaultRoutineTasks[idx].durationSec);
    setIsRunning(false);
  };

  const completionPercent = Math.round((completedTaskIds.length / defaultRoutineTasks.length) * 100);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const totalRoutineMins = defaultRoutineTasks.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="routine-container">
      {/* LEFT: TIMER & CIRCULAR PROGRESS */}
      <div className="routine-timer-card">
        <div className="routine-timer-header">
          <span className="routine-kicker">⚡ 30-Minute Daily Routine (Streak: {streakStats.currentStreak} Days)</span>
          <h2>{currentTask.title}</h2>
          <p>{currentTask.desc}</p>
        </div>

        {/* ANIMATED CIRCLE TIMER */}
        <div className="routine-circle-wrap">
          <svg className="routine-svg" viewBox="0 0 160 160">
            <circle className="circle-bg" cx="80" cy="80" r="70" />
            <circle
              className="circle-progress"
              cx="80"
              cy="80"
              r="70"
              style={{
                strokeDasharray: 440,
                strokeDashoffset: 440 - (440 * (currentTask.durationSec - timeLeft)) / currentTask.durationSec,
              }}
            />
          </svg>
          <div className="circle-center-text">
            <span className="timer-digits">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <span className="task-step-lbl">{currentTask.icon} {currentTask.duration} Min Step</span>
          </div>
        </div>

        {/* TIMER CONTROLS */}
        <div className="routine-timer-btns">
          <button className="em-primary-btn" onClick={() => setIsRunning(!isRunning)} type="button">
            {isRunning ? "Pause Timer" : "Start Step Timer"}
          </button>
          <button
            className="em-secondary-btn"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(currentTask.durationSec);
            }}
            type="button"
          >
            Reset Step
          </button>
        </div>
      </div>

      {/* RIGHT: ROUTINE CHECKLIST & PROGRESS */}
      <div className="routine-checklist-card">
        <div className="checklist-top-bar">
          <div>
            <h3>Daily Routine Checklist</h3>
            <p>POST /api/english/routine Sync ({totalRoutineMins} Mins Total)</p>
          </div>
          <div className="overall-percent-badge">
            <span>{completionPercent}%</span>
            <small>Complete</small>
          </div>
        </div>

        {/* TASK STEPS LIST */}
        <div className="routine-task-list">
          {defaultRoutineTasks.map((task, idx) => {
            const isDone = completedTaskIds.includes(task.id);
            const isSelected = activeTaskIndex === idx;

            return (
              <div
                key={task.id}
                className={`routine-item ${isSelected ? "selected" : ""} ${isDone ? "done" : ""}`}
                onClick={() => handleSelectTask(idx)}
              >
                <button
                  className={`task-checkbox ${isDone ? "checked" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskComplete(task.id);
                  }}
                  type="button"
                >
                  {isDone ? "✓" : ""}
                </button>

                <div className="item-info">
                  <span className="item-icon">{task.icon}</span>
                  <div>
                    <h4>{task.title}</h4>
                    <p>{task.desc}</p>
                  </div>
                </div>

                <div className="item-duration-badge">{task.duration} min</div>
              </div>
            );
          })}
        </div>

        {/* CONGRATS FOOTER */}
        {completionPercent === 100 && (
          <div className="routine-congrats-banner">
            🎉 Outstanding! You completed the full 30-Minute Daily English Routine!
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineView;
