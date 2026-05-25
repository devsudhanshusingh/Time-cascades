import React, { useEffect, useState } from "react";
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
    text: "Some doors should never be opened… but curiosity always finds the key.",
  },
  {
    img: thor,
    logo: Thor,
    text: "When thunder roars, it’s not a storm… it’s Thor.",
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

const TopBar = () => {
  const [currentCard, setCurrentCard] = useState(0);

  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % cards.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar">
      {/* LEFT */}

      <div className="topbar-left">
        <div className="profile-section">
          <img src={profileImg} alt="" className="profile-img" />

          <div>
            <h2>{greeting}, Rain 👋</h2>

            <p>Stay focused and productive today</p>
          </div>
        </div>
      </div>

      <div className="top-icons">
        <img className="top-img" src={sparrow} alt="Sparrow" />
        <img className="top-img" src={bat} alt="Bat" />
        <img className="top-img" src={ham} alt="Ham" />
        <img className="top-img" src={iron} alt="Iron" />
        <img className="top-img" src={hulk} alt="Hulk" />
        <img className="top-img" src={spyder} alt="Spider" />
      </div>
      {/* ROTATING CARD */}

      <div className="topbar-center">
        <div className="quote-card">
          <img src={cards[currentCard].img} alt="" />

          <div className="overlay"></div>

          {cards[currentCard].logo && (
            <img src={cards[currentCard].logo} alt="" className="card-logo" />
          )}

          <p>{cards[currentCard].text}</p>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
