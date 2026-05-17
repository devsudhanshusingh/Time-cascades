import React, { useEffect, useState } from "react";
import "./NewYear.css";

const NewYear = () => {
  const targetDate = new Date("January 1, 2027 00:00:00").getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor(
      (difference % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24),
    );
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { months, days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startOfYear = new Date("January 1, 2026 00:00:00").getTime();
  const endOfYear = new Date("January 1, 2027 00:00:00").getTime();
  const now = new Date().getTime();
  const progress = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;

  return (
    <div className="countdown-container">
      <div className="countdown-card">
        <h1 className="countdown-title">
          Countdown to <span>2027</span>
        </h1>

        <div className="timer-boxes">
          <div className="box">
            <h2>{String(timeLeft.months).padStart(2, "0")}</h2>
            <p>MONTHS</p>
          </div>

          <span>:</span>

          <div className="box">
            <h2>{String(timeLeft.days).padStart(2, "0")}</h2>
            <p>DAYS</p>
          </div>

          <span>:</span>

          <div className="box">
            <h2>{String(timeLeft.hours).padStart(2, "0")}</h2>
            <p>HOURS</p>
          </div>

          <span>:</span>

          <div className="box">
            <h2>{String(timeLeft.minutes).padStart(2, "0")}</h2>
            <p>MINUTES</p>
          </div>

          <span>:</span>

          <div className="box">
            <h2>{String(timeLeft.seconds).padStart(2, "0")}</h2>
            <p>SECONDS</p>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="progress-text">
          {progress.toFixed(2)}% of 2026 completed
        </p>
      </div>
    </div>
  );
};

export default NewYear;
