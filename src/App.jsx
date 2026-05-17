import React from "react";
import TopBar from "./components/TopBar/TopBar";
import Clock from "./components/clock/Clock";
import NewYear from "./components/new_year/NewYear";
import Pomodoro from "./components/Pomodoro/Pomodoro";
import DrinkWater from "./components/DrinkWater/DrinkWater";
import Footer from "./components/Footer/Footer";
import GoalCard from "./components/GoalCard/GoalCard";
import Todo from "./components/Todo/Todo";

import "./App.css";

function App() {
  return (
    <div className="dashboard">
      <TopBar />

      <Clock />
      <div className="main-content">
        <NewYear />

        <div className="bottom-grid">
          <Pomodoro />

          <DrinkWater />
        </div>
        <div className="goal-todo-grid">
          <Todo />
          <GoalCard />
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
