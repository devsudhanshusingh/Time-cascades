import { useState, useEffect } from "react";
import api from "../../api";
import "./GoalCard.css";

const GoalCard = () => {
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState("");
  const [goals, setGoals] = useState([]);
  const [showGoals, setShowGoals] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getCountdown = (targetDate) => {
    if (!targetDate) return "";

    const diff = new Date(targetDate) - new Date();

    if (diff <= 0) {
      return "Completed 🎉";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    let active = true;
    api
      .get("/api/goals")
      .then((res) => {
        if (active && Array.isArray(res.data)) {
          setGoals(res.data.map((g) => ({ ...g, id: g._id || g.id })));
        }
      })
      .catch((error) => {
        console.log("Using local goals state", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const addGoal = async () => {
    if (!goal.trim()) return;

    const newGoalItem = {
      id: Date.now().toString(),
      text: goal.trim(),
      date: date || null,
    };

    setGoals((prev) => [newGoalItem, ...prev]);
    setGoal("");
    setDate("");

    try {
      const payload = { text: newGoalItem.text, date: newGoalItem.date };
      const res = await api.post("/api/goals", payload);
      if (res.data) {
        const created = { ...res.data, id: res.data._id || res.data.id };
        setGoals((prev) =>
          prev.map((item) => (item.id === newGoalItem.id ? created : item))
        );
      }
    } catch (error) {
      console.log("Add goal API failed, saved locally", error);
    }
  };

  const deleteGoal = async (id) => {
    setGoals((prev) => prev.filter((item) => item.id !== id));

    try {
      await api.delete(`/api/goals/${id}`);
    } catch (error) {
      console.log("Delete goal API failed", error);
    }
  };

  return (
    <div className={`goal-card ${showGoals ? "flipped" : ""}`}>
      <div className="goal-card-inner">
        {/* FRONT */}
        <div className="goal-card-face goal-card-front">
          <div className="goal-header">
            <span className="goal-icon">🎯</span>
            <h1>Set Your Goal</h1>
          </div>

          <div className="input-box">
            <span>📝</span>
            <input
              type="text"
              placeholder="e.g. Become a Senior Developer"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
            />
          </div>

          <div className="input-box">
            <span>📅</span>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="goal-btn" onClick={addGoal} type="button">
              Add Goal
            </button>

            <button
              className="goal-btn secondary"
              onClick={() => setShowGoals(true)}
              type="button"
            >
              View Goals ({goals.length})
            </button>
          </div>
        </div>

        {/* BACK */}
        <div className="goal-card-face goal-card-back">
          <div className="goal-back-header">
            <h2>Your Goals</h2>
            <button
              className="goal-btn back"
              onClick={() => setShowGoals(false)}
              type="button"
            >
              ← Back
            </button>
          </div>

          <div className="goal-list">
            {goals.length === 0 ? (
              <div className="empty-state">No active goals set yet.</div>
            ) : (
              goals.map((g) => (
                <div className="goal-item" key={g.id}>
                  <div className="goal-info">
                    <h3>{g.text}</h3>
                    {g.date && (
                      <>
                        <p className="goal-date">
                          Target: {new Date(g.date).toLocaleString()}
                        </p>
                        <p className="countdown">⏳ {getCountdown(g.date)}</p>
                      </>
                    )}
                  </div>

                  <button
                    className="delete-btn"
                    onClick={() => deleteGoal(g.id)}
                    title="Delete goal"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalCard;
