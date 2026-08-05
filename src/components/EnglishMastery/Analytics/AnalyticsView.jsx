import { useState, useEffect } from "react";
import { getAnalyticsData } from "../englishApi";
import "./Analytics.css";

const AnalyticsView = () => {
  const [timeframe, setTimeframe] = useState("Month");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let active = true;
    getAnalyticsData()
      .then((data) => {
        if (active && data) setAnalytics(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const heatmapWeeks = analytics?.heatmapWeeks || Array.from({ length: 24 }, (_, i) => ({
    week: i + 1,
    days: Array.from({ length: 7 }, (_, d) => ({ day: d, level: 0 })),
  }));

  const vocabGrowthData = analytics?.vocabGrowth || [];
  const writingTrendData = analytics?.writingTrends || [];
  const quizStats = analytics?.quizStats || { avgScore: 0, totalQuestions: 0, needsReview: 0 };
  const timeDist = analytics?.timeDistribution || [
    { label: "Vocabulary Drills", percent: 0 },
    { label: "Writing Journal", percent: 0 },
    { label: "Daily Routine", percent: 0 },
    { label: "Quizzes", percent: 0 },
  ];

  return (
    <div className="analytics-container">
      {/* HEADER BAR */}
      <div className="analytics-header-card">
        <div>
          <h2>📈 Comprehensive Learning Analytics</h2>
          <p>Track your vocabulary acquisition, writing accuracy, and study habits over time.</p>
        </div>
        <div className="timeframe-toggle">
          {["Week", "Month", "Year"].map((tf) => (
            <button
              key={tf}
              className={`tf-btn ${timeframe === tf ? "active" : ""}`}
              onClick={() => setTimeframe(tf)}
              type="button"
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* CALENDAR HEATMAP CARD */}
      <div className="heatmap-card">
        <div className="heatmap-header">
          <h3>🔥 Learning Activity Heatmap (`GET /api/english/analytics`)</h3>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="level level-0" />
            <div className="level level-1" />
            <div className="level level-2" />
            <div className="level level-3" />
            <span>More</span>
          </div>
        </div>

        <div className="heatmap-grid-scroll">
          <div className="heatmap-weeks-row">
            {heatmapWeeks.map((w) => (
              <div key={w.week} className="heatmap-week-col">
                {w.days.map((dayObj, idx) => (
                  <div
                    key={idx}
                    className={`heatmap-cell level-${dayObj.level}`}
                    title={`Week ${w.week}: Level ${dayObj.level} study session`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRAPHS ROW */}
      <div className="analytics-grid-row">
        {/* VOCABULARY GROWTH */}
        <div className="chart-panel">
          <h3>📖 Vocabulary Growth (Words Learned)</h3>
          <p className="chart-sub">Cumulative total of mastered terms in MongoDB</p>

          {vocabGrowthData.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No growth records in DB yet.</p>
          ) : (
            <div className="growth-bars-container">
              {vocabGrowthData.map((item, idx) => (
                <div key={idx} className="growth-bar-col">
                  <span className="col-val">{item.words}</span>
                  <div className="col-bar-wrap">
                    <div className="col-bar-fill" style={{ height: `${(item.words / 350) * 100}%` }} />
                  </div>
                  <span className="col-lbl">{item.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WRITING ACCURACY TREND */}
        <div className="chart-panel">
          <h3>✍️ Writing Improvement Trajectory</h3>
          <p className="chart-sub">Grammar, Vocabulary & Fluency evolution</p>

          {writingTrendData.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No journal essay scores in DB yet.</p>
          ) : (
            <div className="writing-trends-list">
              {writingTrendData.map((w, idx) => (
                <div key={idx} className="writing-trend-item">
                  <span className="entry-tag">{w.entry}</span>
                  <div className="metrics-bars-wrap">
                    <div className="m-bar grammar" style={{ width: `${w.grammar}%` }} title={`Grammar: ${w.grammar}%`}>
                      G: {w.grammar}%
                    </div>
                    <div className="m-bar vocab" style={{ width: `${w.vocab}%` }} title={`Vocab: ${w.vocab}%`}>
                      V: {w.vocab}%
                    </div>
                    <div className="m-bar fluency" style={{ width: `${w.fluency}%` }} title={`Fluency: ${w.fluency}%`}>
                      F: {w.fluency}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUIZ PERFORMANCE & TIME DISTRIBUTION */}
      <div className="analytics-grid-row">
        <div className="chart-panel">
          <h3>🎯 Quiz Performance Breakdown</h3>
          <div className="quiz-stats-summary">
            <div className="q-stat-item">
              <span className="stat-num">{quizStats.avgScore}%</span>
              <span className="stat-lbl">Average Score</span>
            </div>
            <div className="q-stat-item">
              <span className="stat-num">{quizStats.totalQuestions}</span>
              <span className="stat-lbl">Questions Answered</span>
            </div>
            <div className="q-stat-item">
              <span className="stat-num">{quizStats.needsReview}</span>
              <span className="stat-lbl">Needs Review</span>
            </div>
          </div>
        </div>

        <div className="chart-panel">
          <h3>⏱️ Study Time Distribution</h3>
          <div className="time-dist-bars">
            {timeDist.map((item, idx) => (
              <div key={idx} className="dist-row">
                <span className="dist-lbl">{item.label}</span>
                <div className="dist-track">
                  <div className="dist-fill" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="dist-val">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
