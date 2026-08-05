import { useState, useEffect } from "react";
import { getAchievementsData } from "../englishApi";
import "./Achievements.css";

const AchievementsView = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAchievementsData()
      .then((data) => {
        if (active && Array.isArray(data)) setAchievements(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="achievements-container">
      {/* HEADER HERO */}
      <div className="achievements-hero-card">
        <div className="ach-hero-info">
          <h2>🏆 Learning Badges & Achievements</h2>
          <p>Earn milestone badges as you expand your English vocabulary, writing skills, and consistency.</p>
        </div>

        <div className="ach-overall-badge">
          <span className="ach-percent">{completionPercent}%</span>
          <span className="ach-sub">{unlockedCount} of {achievements.length} Unlocked</span>
        </div>
      </div>

      {/* CARDS GRID */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading achievements from database...</p>
      ) : achievements.length === 0 ? (
        <div style={{ textCenter: "center", padding: "40px", background: "var(--panel-bg)", borderRadius: "24px", border: "1px solid var(--border)" }}>
          <h3>No Achievement Badges in DB</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
            Add achievements to MongoDB or call <code>GET /api/english/achievements</code> to populate progress!
          </p>
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((ach) => {
            const percent = Math.min(100, Math.round(((ach.progress || 0) / (ach.total || 1)) * 100));

            return (
              <div key={ach.id || ach._id} className={`achievement-card ${ach.unlocked ? "unlocked" : "locked"}`}>
                <div className="ach-card-top">
                  <div className="ach-icon-circle">{ach.icon || "🏆"}</div>
                  <span className={`ach-status-tag ${ach.unlocked ? "unlocked" : "locked"}`}>
                    {ach.unlocked ? "Unlocked ✓" : "Locked 🔒"}
                  </span>
                </div>

                <div className="ach-card-body">
                  <h3>{ach.title}</h3>
                  <p>{ach.desc}</p>
                </div>

                <div className="ach-card-footer">
                  <div className="ach-progress-info">
                    <span>Progress</span>
                    <span>{ach.progress || 0} / {ach.total || 1}</span>
                  </div>
                  <div className="ach-progress-track">
                    <div className="ach-progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                  {ach.unlockedDate && (
                    <span className="unlocked-date">Unlocked on {String(ach.unlockedDate).split("T")[0]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AchievementsView;
