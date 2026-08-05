import { useEffect, useState } from "react";
import "./TopBar.css";

import profileImg from "../../assets/msd.png";
import upsidedown from "../../assets/upsidedown.jpg";
import thor from "../../assets/thor.jpg";
import wwy from "../../assets/wwy.jpg";
import yourname from "../../assets/yourname.jpg";
import stl from "../../assets/Stranger-Things-Logo.webp";
import your from "../../assets/your-logo.png";
import Thor from "../../assets/Thor_Logo.webp";
import wwylogo from "../../assets/wwy-logo.png";
import sparrow from "../../assets/giphy.webp";
import bat from "../../assets/bat.png";
import ham from "../../assets/ham.jpg";
import hulk from "../../assets/hulk.png";
import spyder from "../../assets/spy.png";
import iron from "../../assets/iron.png";

const cards = [
  {
    img: upsidedown,
    logo: stl,
    text: "Some doors should never be opened, but curiosity always finds the key.",
  },
  {
    img: thor,
    logo: Thor,
    text: "When thunder roars, it is not a storm. It is Thor.",
  },
  {
    img: wwy,
    logo: wwylogo,
    text: "Some love stories are powerful enough to change the sky.",
  },
  {
    img: yourname,
    logo: your,
    text: "Some connections are written beyond time itself.",
  },
];

const visualModes = [
  { id: "sunny-day", label: "Sunny Day", mark: "☀️ SUN" },
  { id: "moon-night", label: "Moon Night", mark: "🌙 MOON" },
  { id: "rainy-day", label: "Rainy Day", mark: "🌧️ RAIN" },
  { id: "rainy-night", label: "Rainy Night", mark: "⚡ STORM" },
];

const heroes = [
  { src: sparrow, name: "Captain Jack" },
  { src: bat, name: "Batman" },
  { src: ham, name: "Piggy Hero" },
  { src: iron, name: "Iron Man" },
  { src: hulk, name: "Hulk" },
  { src: spyder, name: "Spider-Man" },
];

const TopBar = ({
  visualMode = "sunny-day",
  onVisualModeChange,
  userName = "Rain",
  activeModule = "productivity",
  onModuleChange,
}) => {
  const [currentCard, setCurrentCard] = useState(0);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % cards.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="profile-section">
          <img src={profileImg} alt="User profile" className="profile-img" />
          <div>
            <h2>{greeting}, {userName}</h2>
            <p>Time Cascades Command Center</p>
          </div>
        </div>

        {/* MODULE SWITCHER PILLS */}
        <div className="main-module-switch" aria-label="Main Navigation Modules">
          <button
            className={`module-btn ${activeModule === "productivity" ? "active" : ""}`}
            onClick={() => onModuleChange?.("productivity")}
            type="button"
          >
            🚀 Productivity
          </button>
          <button
            className={`module-btn ${activeModule === "english" ? "active" : ""}`}
            onClick={() => onModuleChange?.("english")}
            type="button"
          >
            🇬🇧 English Mastery
          </button>
        </div>
      </div>

      <div className="topbar-center">
        <div className="quote-card" key={currentCard}>
          <img src={cards[currentCard].img} alt="Card visual" className="quote-bg" />
          <div className="overlay"></div>

          {cards[currentCard].logo && (
            <img src={cards[currentCard].logo} alt="Brand logo" className="card-logo" />
          )}

          <p>{cards[currentCard].text}</p>
        </div>
      </div>

      <div className="topbar-tools">
        <div className="visual-mode-switch" aria-label="Dashboard visual mode">
          {visualModes.map((mode) => (
            <button
              key={mode.id}
              className={visualMode === mode.id ? "active" : ""}
              onClick={() => onVisualModeChange?.(mode.id)}
              title={`Switch to ${mode.label} theme`}
              type="button"
            >
              <span>{mode.mark}</span>
            </button>
          ))}
        </div>

        <div className="top-icons" title="Productivity Badges">
          {heroes.map((hero, idx) => (
            <div key={idx} className="badge-wrapper" title={hero.name}>
              <img className="top-img" src={hero.src} alt={hero.name} />
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
