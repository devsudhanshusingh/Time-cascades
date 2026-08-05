import { useState } from "react";
import EnglishDashboard from "./Dashboard/EnglishDashboard";
import SpellingView from "./Spelling/SpellingView";
import JournalView from "./WritingJournal/JournalView";
import RoutineView from "./DailyRoutine/RoutineView";
import AnalyticsView from "./Analytics/AnalyticsView";
import AchievementsView from "./Achievements/AchievementsView";
import ToastNotification from "./Toast/ToastNotification";
import "./EnglishMastery.css";

const subPages = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "spelling", label: "Spelling & Typing", icon: "⌨️" },
  { id: "journal", label: "Writing Journal", icon: "✍️" },
  { id: "routine", label: "Daily Routine", icon: "⏱️" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
];

const EnglishMasteryContainer = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <EnglishDashboard onNavigate={setActiveTab} showToast={showToast} />;
      case "spelling":
        return <SpellingView showToast={showToast} />;
      case "journal":
        return <JournalView showToast={showToast} />;
      case "routine":
        return <RoutineView showToast={showToast} />;
      case "analytics":
        return <AnalyticsView showToast={showToast} />;
      case "achievements":
        return <AchievementsView showToast={showToast} />;
      default:
        return <EnglishDashboard onNavigate={setActiveTab} showToast={showToast} />;
    }
  };

  return (
    <div className="english-mastery-container">
      {/* MODULE HEADER & SUB-NAV BAR */}
      <nav className="em-subnav-bar">
        <div className="em-subnav-title">
          <span className="em-logo-badge">🇬🇧</span>
          <div>
            <h1>English Mastery Platform</h1>
            <p>Accelerated Fluency, Writing & Spelling Command Center</p>
          </div>
        </div>

        <div className="em-tab-pills">
          {subPages.map((page) => (
            <button
              key={page.id}
              className={`em-tab-btn ${activeTab === page.id ? "active" : ""}`}
              onClick={() => setActiveTab(page.id)}
              type="button"
            >
              <span className="em-tab-icon">{page.icon}</span>
              {page.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ACTIVE VIEW CONTENT */}
      <main className="em-view-content">{renderActiveView()}</main>

      {/* TOAST FEEDBACK */}
      <ToastNotification
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
};

export default EnglishMasteryContainer;
