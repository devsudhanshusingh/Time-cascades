// GoalCard.jsx

import React, { useState } from "react";
import "./GoalCard.css";

const GoalCard = () => {
  const [goal, setGoal] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="goal-card">
      {/* Title */}

      <div className="goal-header">
        <span className="goal-icon">🎯</span>

        <h1>Set Your Goal</h1>
      </div>

      {/* Goal Name */}

      <div className="goal-group">
        <label>Goal Name</label>

        <input
          type="text"
          placeholder="e.g. Become a Senior Developer"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>

      {/* Date */}

      <div className="goal-group">
        <label>Target Date</label>

        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Button */}

      <button className="goal-btn">Start Countdown</button>
    </div>
  );
};

export default GoalCard;
