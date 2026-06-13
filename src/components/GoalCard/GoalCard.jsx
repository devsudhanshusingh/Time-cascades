// GoalCard.jsx

import { useState, useEffect } from "react";
import axios from "axios";
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

  const fetchGoals = async () => {
    try {
      const res = await axios.get(
        "https://my-server-1-nvrv.onrender.com/api/goals",
      );

      const list = Array.isArray(res.data)
        ? res.data.map((g) => ({ ...g, id: g._id || g.id }))
        : [];

      setGoals(list);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchGoals, 0);
    return () => clearTimeout(timer);
  }, []);

  const addGoal = async () => {
    if (!goal.trim()) return;

    try {
      const payload = { text: goal.trim(), date: date || null };

      const res = await axios.post(
        "https://my-server-1-nvrv.onrender.com/api/goals",
        payload,
      );

      const created = { ...res.data, id: res.data._id || res.data.id };

      setGoals((prev) => [created, ...prev]);

      setGoal("");

      setDate("");
    } catch (error) {
      console.error("Failed to add goal:", error);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await axios.delete(
        `https://my-server-1-nvrv.onrender.com/api/goals/${id}`,
      );

      setGoals((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete goal:", error);
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
              placeholder="Become a Senior Developer"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
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
            <button className="goal-btn" onClick={addGoal}>
              Add Goal
            </button>

            <button
              className="goal-btn secondary"
              onClick={() => setShowGoals(true)}
            >
              View Goals
            </button>
          </div>
        </div>

        {/* BACK */}

        <div className="goal-card-face goal-card-back">
          <div className="goal-back-header">
            <span>Goals</span>

            <button
              className="goal-btn back"
              onClick={() => setShowGoals(false)}
            >
              Back
            </button>
          </div>

          <div className="goal-list">
            {goals.length === 0 ? (
              <div className="empty-state">No goals yet</div>
            ) : (
              goals.map((g) => (
                <div className="goal-item" key={g.id}>
                  <div>
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
