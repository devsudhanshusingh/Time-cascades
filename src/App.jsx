import { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "./components/TopBar/TopBar";
import Clock from "./components/clock/Clock";
import NewYear from "./components/new_year/NewYear";
import Pomodoro from "./components/Pomodoro/Pomodoro";
import DrinkWater from "./components/DrinkWater/DrinkWater";
import Footer from "./components/Footer/Footer";
import GoalCard from "./components/GoalCard/GoalCard";
import DailyTasks from "./components/DailyTasks/DailyTasks";
import api, {
  API_BASE_URL,
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
} from "./api";
import "./App.css";

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload =
        mode === "signup"
          ? form
          : { email: form.email, password: form.password };
      const { data } = await api.post(`/api/auth/${mode}`, payload);
      const token = data?.token || data?.jwt || data?.accessToken;

      if (!token) {
        throw new Error("The server did not return a token.");
      }

      const auth = {
        token,
        user: data?.user || { name: form.name || form.email.split("@")[0] },
      };

      setStoredAuth(auth);
      onAuth(auth);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Authentication failed. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="Time Cascades introduction">
        <div className="brand-mark">TC</div>
        <h1>Time Cascades</h1>
        <p>
          A focused command center for tasks, pomodoros, hydration, and goals.
        </p>
        <div className="hero-metrics">
          <span>Tasks</span>
          <span>Focus</span>
          <span>Water</span>
          <span>Goals</span>
        </div>
      </section>

      <section className="auth-card" aria-label="Authentication form">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && (
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rain"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-action" disabled={busy}>
            {busy ? "Working..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <p className="api-note">Connected to {API_BASE_URL}</p>
      </section>
    </main>
  );
}

function Dashboard({ auth, onLogout }) {
  const token = auth?.token;
  const [visualMode, setVisualMode] = useState("sunny-day");

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }

    return () => {
      delete axios.defaults.headers.common.Authorization;
    };
  }, [token]);

  return (
    <div className="dashboard" data-theme={visualMode}>
      <div className="rain-layer" aria-hidden="true">
        {Array.from({ length: 68 }, (_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="session-bar">
        <span>Signed in as {auth?.user?.name || auth?.user?.email || "Rain"}</span>
        <button onClick={onLogout}>Logout</button>
      </div>

      <TopBar visualMode={visualMode} onVisualModeChange={setVisualMode} />

      <Clock />
      <div className="main-content">
        <NewYear />

        <div className="bottom-grid">
          <Pomodoro />
          <DrinkWater />
        </div>

        <div className="goal-todo-grid single-card">
          <GoalCard />
        </div>

        <DailyTasks />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const logout = () => {
    clearStoredAuth();
    delete axios.defaults.headers.common.Authorization;
    setAuth(null);
  };

  if (!auth?.token) {
    return <AuthScreen onAuth={setAuth} />;
  }

  return <Dashboard auth={auth} onLogout={logout} />;
}

export default App;
