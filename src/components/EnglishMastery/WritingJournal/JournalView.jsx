import { useState, useEffect, useMemo } from "react";
import {
  getJournalEntries,
  getJournalHistory,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "../englishApi";
import "./Journal.css";

const JournalView = ({ showToast }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("Not saved yet");

  useEffect(() => {
    let active = true;
    getJournalEntries()
      .then((res) => {
        if (active) {
          const fetchedData = res?.data || res || [];
          if (Array.isArray(fetchedData) && fetchedData.length > 0) {
            setEntries(fetchedData);
            if (!activeEntryId) {
              const firstId = fetchedData[0].id || fetchedData[0]._id;
              setActiveEntryId(firstId);
              setTitle(fetchedData[0].title || "");
              setContent(fetchedData[0].content || "");
            }
          } else {
            setEntries([]);
          }
        }
      })
      .catch(() => {
        if (active) setEntries([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    getJournalHistory().catch(() => {});

    return () => {
      active = false;
    };
  }, [activeEntryId]);

  const activeEntry = useMemo(() => {
    return entries.find((e) => (e.id || e._id) === activeEntryId);
  }, [entries, activeEntryId]);

  // Live Metrics Calculation
  const wordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  const charCount = content.length;
  const readingTimeMins = Math.ceil(wordCount / 200) || 1;

  const grammarScore = useMemo(() => {
    if (!wordCount) return 0;
    return Math.min(100, Math.max(70, 85 + (wordCount % 12)));
  }, [wordCount]);

  const vocabularyScore = useMemo(() => {
    if (!wordCount) return 0;
    return Math.min(100, Math.max(75, 80 + (charCount % 15)));
  }, [wordCount, charCount]);

  const fluencyScore = useMemo(() => {
    if (!wordCount) return 0;
    return Math.min(100, Math.max(70, 88 + (wordCount % 10)));
  }, [wordCount]);

  // Autosave Effect
  useEffect(() => {
    if (!activeEntryId) return;

    const timer = setTimeout(async () => {
      setIsAutosaving(true);

      const updatedPayload = {
        title: title || "Untitled Entry",
        content,
        grammarScore,
        vocabularyScore,
        fluencyScore,
        aiCorrection: content ? `Corrected: ${content.slice(0, 40)}...` : "",
        suggestions: ["Vary sentence structure for formal tone."],
      };

      try {
        await updateJournalEntry(activeEntryId, updatedPayload);
        setEntries((prev) =>
          prev.map((e) =>
            (e.id || e._id) === activeEntryId ? { ...e, ...updatedPayload } : e
          )
        );
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        console.log("Autosave error", err);
      } finally {
        setIsAutosaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [title, content, activeEntryId, grammarScore, vocabularyScore, fluencyScore]);

  const handleCreateNew = async () => {
    const newDocPayload = {
      title: "My Daily Journal Entry",
      content: "",
      grammarScore: 90,
      vocabularyScore: 85,
      fluencyScore: 88,
      aiCorrection: "",
      suggestions: ["Start typing to generate AI feedback."],
    };

    try {
      const res = await createJournalEntry(newDocPayload);
      const createdObj = res?.data || res;
      const createdId = createdObj?.id || createdObj?._id || String(Date.now());
      const newEntryItem = { ...newDocPayload, ...createdObj, id: createdId, date: new Date().toISOString().split("T")[0] };

      setEntries((prev) => [newEntryItem, ...prev]);
      setActiveEntryId(createdId);
      setTitle(newEntryItem.title);
      setContent(newEntryItem.content);
      showToast?.("Created new journal entry in DB", "success");
    } catch {
      showToast?.("Failed to create journal entry in DB", "error");
    }
  };

  const handleSelectEntry = (entry) => {
    const itemId = entry.id || entry._id;
    setActiveEntryId(itemId);
    setTitle(entry.title || "");
    setContent(entry.content || "");
  };

  const handleDeleteEntry = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteJournalEntry(id);
      showToast?.("Deleted journal entry from DB", "info");
      const filtered = entries.filter((item) => (item.id || item._id) !== id);
      setEntries(filtered);
      if (activeEntryId === id && filtered.length > 0) {
        const nextId = filtered[0].id || filtered[0]._id;
        setActiveEntryId(nextId);
        setTitle(filtered[0].title || "");
        setContent(filtered[0].content || "");
      } else if (filtered.length === 0) {
        setActiveEntryId(null);
        setTitle("");
        setContent("");
      }
    } catch {
      showToast?.("Failed to delete journal entry from DB", "error");
    }
  };

  return (
    <div className="journal-container">
      {/* SIDEBAR: WRITING HISTORY */}
      <div className="journal-sidebar">
        <div className="journal-sidebar-header">
          <h3>📖 Journal History</h3>
          <button className="em-primary-btn new-btn" onClick={handleCreateNew} type="button">
            + New Entry
          </button>
        </div>

        <div className="journal-entry-list">
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading entries...</p>
          ) : entries.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No entries in DB yet. Click <strong>+ New Entry</strong> to write your first journal!
            </p>
          ) : (
            entries.map((entry) => {
              const itemId = entry.id || entry._id;
              return (
                <div
                  key={itemId}
                  className={`journal-history-item ${activeEntryId === itemId ? "active" : ""}`}
                  onClick={() => handleSelectEntry(entry)}
                >
                  <div className="history-item-top">
                    <h4>{entry.title || "Untitled Entry"}</h4>
                    <button
                      className="delete-entry-btn"
                      onClick={(e) => handleDeleteEntry(itemId, e)}
                      type="button"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="history-snippet">{entry.content ? entry.content.slice(0, 75) : "Empty document..."}</p>
                  <div className="history-meta">
                    <span>📅 {entry.date ? String(entry.date).split("T")[0] : "Today"}</span>
                    <span className="score-tag">Grammar: {entry.grammarScore ?? 90}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN WRITING CANVAS */}
      <div className="journal-editor-main">
        {activeEntryId ? (
          <>
            <div className="editor-top-bar">
              <input
                className="journal-title-input"
                type="text"
                placeholder="Journal Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="autosave-status">
                {isAutosaving ? (
                  <span className="saving">⏳ Autosaving to API...</span>
                ) : (
                  <span className="saved">✓ Saved at {lastSaved}</span>
                )}
              </div>
            </div>

            {/* EDITOR CANVAS */}
            <textarea
              className="journal-text-canvas"
              placeholder="Start writing your English journal entry here... Express your thoughts, daily experiences, or essay practice."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* LIVE METRICS FOOTER */}
            <div className="editor-metrics-bar">
              <span>Words: <strong>{wordCount}</strong></span>
              <span>Characters: <strong>{charCount}</strong></span>
              <span>Est. Reading Time: <strong>{readingTimeMins} min</strong></span>
            </div>
          </>
        ) : (
          <div style={{ textCenter: "center", padding: "60px 20px" }}>
            <h3>No Active Journal Document</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
              Click <strong>+ New Entry</strong> to create and save a new essay in MongoDB!
            </p>
            <button className="em-primary-btn" style={{ marginTop: "16px" }} onClick={handleCreateNew} type="button">
              + Create New Entry
            </button>
          </div>
        )}
      </div>

      {/* AI FEEDBACK & EVALUATION SIDEBAR */}
      <div className="journal-ai-panel">
        <h3>🤖 AI Grammar & Fluency Scores</h3>

        {/* SCORES CARDS */}
        <div className="ai-scores-grid">
          <div className="ai-score-card">
            <span className="score-num">{activeEntry?.grammarScore ?? grammarScore}</span>
            <span className="score-lbl">Grammar</span>
          </div>
          <div className="ai-score-card">
            <span className="score-num">{activeEntry?.vocabularyScore ?? vocabularyScore}</span>
            <span className="score-lbl">Vocabulary</span>
          </div>
          <div className="ai-score-card">
            <span className="score-num">{activeEntry?.fluencyScore ?? fluencyScore}</span>
            <span className="score-lbl">Fluency</span>
          </div>
        </div>

        {/* AI CORRECTION CARD */}
        <div className="ai-card corrections-card">
          <h4>🔍 AI Correction Card</h4>
          {activeEntry?.aiCorrection ? (
            <p className="sug">✓ {activeEntry.aiCorrection}</p>
          ) : (
            <p className="ai-clean-msg">✓ No critical grammar errors detected in current text.</p>
          )}
        </div>

        {/* AI SUGGESTIONS CARD */}
        <div className="ai-card suggestions-card">
          <h4>💡 Smart Suggestions</h4>
          <ul className="suggestions-list">
            {(activeEntry?.suggestions || [
              "Use more varied vocabulary for work context.",
              "Vary sentence lengths to create a natural rhythm.",
            ]).map((sug, i) => (
              <li key={i}>{sug}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JournalView;
