// TopBar.jsx

import React from "react";
import "./TopBar.css";

const TopBar = () => {
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="topbar">
      {/* LEFT */}

      <div className="topbar-left">
        <div className="topbar-logo"></div>

        <div>
          <h2>{greeting}, Rain 👋</h2>

          <p>Stay focused and productive today</p>
        </div>
      </div>

      {/* CENTER */}

      <div className="topbar-center">
        <div className="status-dot"></div>

        <span>Focus Mode Active</span>
      </div>

      {/* RIGHT */}

      <div className="topbar-right">
        <div className="mini-card">
          <h3>04</h3>

          <p>Tasks</p>
        </div>

        <div className="mini-card">
          <h3>2.5L</h3>

          <p>Goal</p>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
