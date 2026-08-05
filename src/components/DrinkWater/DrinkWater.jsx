import { useState, useEffect } from "react";
import api from "../../api";
import "./DrinkWater.css";

const DrinkWater = () => {
  const smallCupSize = 250;

  const [liters, setLiters] = useState("2.5");
  const [goalML, setGoalML] = useState(2500);
  const [currentLogId, setCurrentLogId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedCups, setSelectedCups] = useState([]);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await api.get("/api/drink-water/today");
        if (res.data) {
          const log = res.data;
          setCurrentLogId(log._id || log.id || null);
          setLiters(log.goalLiters ? String(log.goalLiters) : "2.5");
          setGoalML(log.goalLiters ? Number(log.goalLiters) * 1000 : 2500);

          if (Array.isArray(log.cups)) {
            setSelectedCups(log.cups.map((_, idx) => idx));
          } else if (typeof log.filledAmount === "number") {
            const count = Math.floor((log.filledAmount || 0) / smallCupSize);
            setSelectedCups(Array.from({ length: count }, (_, i) => i));
          }
        }
      } catch (error) {
        console.log("Using default water log state", error);
      }
    };

    fetchToday();
  }, []);

  const totalGoal = Number(liters || 0) * 1000;
  const totalCups = goalML ? Math.ceil(goalML / smallCupSize) : 0;

  const handleCupClick = async (idx) => {
    let updated = [...selectedCups];
    if (updated.includes(idx)) {
      updated = updated.filter((cup) => cup !== idx);
    } else {
      updated.push(idx);
    }

    setSelectedCups(updated);

    if (!currentLogId) return;

    try {
      await api.patch(`/api/drink-water/${currentLogId}/toggle-cup`);
    } catch (error) {
      console.log("Toggle cup API failed, state saved locally", error);
    }
  };

  const handleSubmitGoal = async () => {
    if (isEditing) {
      if (totalGoal > 0) {
        setGoalML(totalGoal);
        setIsEditing(false);

        try {
          const res = await api.post("/api/drink-water", {
            goalLiters: Number(liters),
          });
          if (res.data) {
            setCurrentLogId(res.data._id || res.data.id || null);
          }
        } catch (error) {
          console.log("Create water log failed, running offline", error);
        }
      }
    } else {
      setIsEditing(true);
    }
  };

  const filledAmount = selectedCups.length * smallCupSize;
  const remainedVal = Math.max(0, goalML - filledAmount);
  const remained = (remainedVal / 1000).toFixed(2);
  const percentage = goalML ? Math.min(100, Math.round((filledAmount / goalML) * 100)) : 0;

  return (
    <div className="drinkwater-container">
      <div className="drinkwater-card">
        <h1 className="title">💧 Drink Water</h1>

        <div className="glass-input">
          <input
            type="number"
            step="0.1"
            placeholder="Enter liters (ex: 2.5)"
            value={liters}
            disabled={!isEditing}
            onChange={(e) => setLiters(e.target.value)}
          />

          <button onClick={handleSubmitGoal} type="button">
            {isEditing ? "Save Goal" : "Edit Goal"}
          </button>
        </div>

        <h3 className="goal-subtitle">Daily Goal: <span>{liters || 0} L</span></h3>

        <div className="cup" aria-label="Hydration progress visualizer">
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

        <p className="text">Tap 250ml glasses to log hydration</p>

        <div className="cups">
          {Array.from({ length: totalCups }).map((_, idx) => (
            <div
              key={idx}
              className={`cup-small ${selectedCups.includes(idx) ? "full" : ""}`}
              onClick={() => handleCupClick(idx)}
              title={`250ml glass ${idx + 1}`}
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
