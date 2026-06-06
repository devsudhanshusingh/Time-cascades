import React, { useState, useEffect } from "react";
import "./DrinkWater.css";
import axios from "axios";

const DrinkWater = () => {
  const smallCupSize = 250;

  const [liters, setLiters] = useState("");
  const [goalML, setGoalML] = useState(0);
  const [currentLogId, setCurrentLogId] = useState(null);

  const [isEditing, setIsEditing] = useState(true);
  const [selectedCups, setSelectedCups] = useState([]);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await axios.get(
          "https://my-server-1-nvrv.onrender.com/api/drink-water/today",
        );

        if (res.data) {
          const log = res.data;
          setCurrentLogId(log._id || log.id || null);
          setLiters(log.goalLiters ? String(log.goalLiters) : "");
          setGoalML(log.goalLiters ? Number(log.goalLiters) * 1000 : 0);

          // if API returns cups info, set selectedCups accordingly
          if (Array.isArray(log.cups)) {
            const cups = log.cups.map((_, idx) => idx);
            setSelectedCups(cups);
          } else if (typeof log.filledAmount === "number") {
            const count = Math.floor((log.filledAmount || 0) / smallCupSize);
            setSelectedCups(Array.from({ length: count }, (_, i) => i));
          }
        }
      } catch (error) {
        // no today's log or failed
        // console.error('Failed to fetch today log', error)
      }
    };

    fetchToday();
  }, []);

  const totalGoal = Number(liters || 0) * 1000;

  const totalCups = goalML ? Math.ceil(goalML / smallCupSize) : 0;

  const handleCupClick = async (idx) => {
    // optimistic local update
    let updated = [...selectedCups];

    if (updated.includes(idx)) {
      updated = updated.filter((cup) => cup !== idx);
    } else {
      updated.push(idx);
    }

    setSelectedCups(updated);

    if (!currentLogId) return;

    try {
      await axios.patch(
        `https://my-server-1-nvrv.onrender.com/api/drink-water/${currentLogId}/toggle-cup`,
      );

      // re-fetch today's log to sync exact state
      const res = await axios.get(
        "https://my-server-1-nvrv.onrender.com/api/drink-water/today",
      );

      if (res.data) {
        const log = res.data;
        setCurrentLogId(log._id || log.id || null);
        setLiters(log.goalLiters ? String(log.goalLiters) : "");
        setGoalML(log.goalLiters ? Number(log.goalLiters) * 1000 : 0);

        if (Array.isArray(log.cups)) {
          const cups = log.cups.map((_, i) => i);
          setSelectedCups(cups);
        } else if (typeof log.filledAmount === "number") {
          const count = Math.floor((log.filledAmount || 0) / smallCupSize);
          setSelectedCups(Array.from({ length: count }, (_, i) => i));
        }
      }
    } catch (error) {
      console.error("Failed to toggle cup:", error);
    }
  };

  const filledAmount = selectedCups.length * smallCupSize;

  const remained = ((goalML - filledAmount) / 1000).toFixed(2);

  const percentage = goalML ? ((filledAmount / goalML) * 100).toFixed(1) : 0;

  return (
    <div className="drinkwater-container">
      <div className="drinkwater-card">
        <h1>💧 Drink Water</h1>

        {/* Goal Input */}

        <div className="glass-input">
          <input
            type="number"
            step="0.1"
            placeholder="Enter liters (ex: 2.5)"
            value={liters}
            disabled={!isEditing}
            onChange={(e) => setLiters(e.target.value)}
          />

          <button
            onClick={async () => {
              if (isEditing) {
                if (totalGoal > 0) {
                  try {
                    const payload = { goalLiters: Number(liters) };

                    const res = await axios.post(
                      "https://my-server-1-nvrv.onrender.com/api/drink-water",
                      payload,
                    );

                    const created = res.data;
                    setCurrentLogId(created._id || created.id || null);
                    setGoalML(
                      created.goalLiters
                        ? Number(created.goalLiters) * 1000
                        : totalGoal,
                    );
                    setSelectedCups([]);
                    setIsEditing(false);
                  } catch (error) {
                    console.error("Failed to create drink-water log:", error);
                  }
                }
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Submit" : "Edit"}
          </button>
        </div>

        <h3>Goal: {liters || 0} L</h3>

        {/* Big Glass */}

        <div className="cup">
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

        <p className="text">Select your 250ml glasses</p>

        {/* Small Glasses */}

        <div className="cups">
          {Array.from({
            length: totalCups,
          }).map((_, idx) => (
            <div
              key={idx}
              className={`cup-small ${
                selectedCups.includes(idx) ? "full" : ""
              }`}
              onClick={() => handleCupClick(idx)}
            >
              250ml
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrinkWater;
