import React, { useState } from "react";
import "./DrinkWater.css";

const DrinkWater = () => {
  const smallCupSize = 250;

  // Goal Inputs
  const [liters, setLiters] = useState("");
  const [ml, setMl] = useState("");

  // Final Goal
  const [goalML, setGoalML] = useState(0);

  // Edit / Submit
  const [isEditing, setIsEditing] = useState(true);

  // Selected Cups
  const [selectedCups, setSelectedCups] = useState([]);

  // Total Goal
  const totalGoal = Number(liters || 0) * 1000 + Number(ml || 0);

  // Total Cups
  const totalCups = goalML ? Math.ceil(goalML / smallCupSize) : 0;

  // Cup Click
  const handleCupClick = (idx) => {
    let updated = [...selectedCups];

    if (updated.includes(idx)) {
      updated = updated.filter((cup) => cup !== idx);
    } else {
      updated.push(idx);
    }

    setSelectedCups(updated);
  };

  // Water Calculation
  const filledAmount = selectedCups.length * smallCupSize;

  const remained = ((goalML - filledAmount) / 1000).toFixed(2);

  const percentage = goalML ? ((filledAmount / goalML) * 100).toFixed(1) : 0;

  return (
    <div className="drinkwater-container">
      <h1>Drink Water</h1>

      {/* Goal Inputs */}

      <div className="glass-input">
        <input
          type="number"
          placeholder="Liters"
          value={liters}
          disabled={!isEditing}
          onChange={(e) => setLiters(e.target.value)}
        />

        <input
          type="number"
          placeholder="ML"
          value={ml}
          disabled={!isEditing}
          onChange={(e) => setMl(e.target.value)}
        />

        <button
          onClick={() => {
            if (isEditing) {
              if (totalGoal > 0) {
                setGoalML(totalGoal);

                setSelectedCups([]);

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

      {/* Goal Text */}

      <h3>Goal: {(goalML / 1000).toFixed(2)} Liters</h3>

      {/* Big Cup */}

      <div className="cup">
        {/* Remaining */}

        {percentage < 100 && (
          <div
            className="remained"
            style={{
              height: `${100 - percentage}%`,
            }}
          >
            <span>{remained}L</span>

            <small>Remained</small>
          </div>
        )}

        {/* Filled */}

        {percentage > 0 && (
          <div
            className="percentage"
            style={{
              height: `${percentage}%`,
            }}
          >
            {percentage}%
          </div>
        )}
      </div>

      <p className="text">
        Select how many 250ml glasses of water that you have drank
      </p>

      {/* Small Cups */}

      <div className="cups">
        {Array.from({
          length: totalCups,
        }).map((_, idx) => (
          <div
            key={idx}
            className={`cup-small ${selectedCups.includes(idx) ? "full" : ""}`}
            onClick={() => handleCupClick(idx)}
          >
            250 ml
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrinkWater;
