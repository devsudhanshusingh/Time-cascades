import React from "react";
import Clock from "./components/clock/Clock";
import NewYear from "./components/new_year/NewYear";
import Pomodoro from "./components/Pomodoro/Pomodoro";
import DrinkWater from "./components/DrinkWater/DrinkWater";
import "./App.css";

function App() {
  return (
    <>
   
      <Clock />
      <NewYear />
      <Pomodoro/>
      <DrinkWater/>
   </>
  );
}

export default App;
