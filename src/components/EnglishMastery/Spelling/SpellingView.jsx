import { useState, useEffect, useRef, useCallback } from "react";
import { getRandomVocabularyWord, addVocabularyWord, addVocabularyBulk, logSpellingSession } from "../englishApi";
import "./Spelling.css";

const SpellingView = ({ showToast }) => {
  const [currentWord, setCurrentWord] = useState(null);
  const [typedInput, setTypedInput] = useState("");
  const [targetCount, setTargetCount] = useState(20);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Typing Metrics
  const [startTime, setStartTime] = useState(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Management Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState("single");

  // Single word form
  const [singleWord, setSingleWord] = useState({
    word: "",
    meaning: "",
    pronunciation: "",
    difficulty: "Medium",
    category: "General",
  });

  // CSV Bulk Upload state
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");

  const inputRef = useRef(null);

  const fetchNextWord = useCallback(() => {
    setLoading(true);
    setTypedInput("");
    setCompletedCount(0);
    setStartTime(null);
    setTotalKeystrokes(0);
    setErrorCount(0);
    setWpm(0);
    setAccuracy(100);

    getRandomVocabularyWord()
      .then((data) => {
        if (data?.word) {
          setCurrentWord(data);
        } else {
          setCurrentWord(null);
        }
      })
      .catch((err) => {
        console.log("No vocabulary words in DB yet", err);
        setCurrentWord(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    getRandomVocabularyWord()
      .then((data) => {
        if (active && data?.word) setCurrentWord(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && currentWord) inputRef.current.focus();
  }, [currentWord]);

  const targetWordText = currentWord?.word || "";

  // Speak Word
  const speakCurrentWord = useCallback(() => {
    if ("speechSynthesis" in window && targetWordText) {
      const utterance = new SpeechSynthesisUtterance(targetWordText);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  }, [targetWordText]);

  // Calculate WPM and Accuracy
  const updateMetrics = useCallback(
    (strokeCount, currentErrors) => {
      if (!startTime) return;
      const timeElapsedMins = (Date.now() - startTime) / 60000;
      if (timeElapsedMins > 0.01) {
        const wordsTyped = strokeCount / 5;
        const calculatedWpm = Math.round(wordsTyped / timeElapsedMins);
        setWpm(calculatedWpm);
      }

      if (strokeCount > 0) {
        const acc = Math.max(0, Math.round(((strokeCount - currentErrors) / strokeCount) * 100));
        setAccuracy(acc);
      }
    },
    [startTime]
  );

  const handleInputChange = (e) => {
    if (!currentWord) return;
    const val = e.target.value;

    if (!startTime && val.length === 1) {
      setStartTime(Date.now());
    }

    const nextStrokeCount = totalKeystrokes + 1;
    setTotalKeystrokes(nextStrokeCount);

    let currentErr = errorCount;
    const lastChar = val[val.length - 1];
    const expectedChar = targetWordText[val.length - 1];
    if (lastChar && lastChar.toLowerCase() !== expectedChar?.toLowerCase()) {
      currentErr += 1;
      setErrorCount(currentErr);
    }

    setTypedInput(val);
    updateMetrics(nextStrokeCount, currentErr);

    // Check if word matches target
    if (val.trim().toLowerCase() === targetWordText.toLowerCase()) {
      const nextCompleted = completedCount + 1;
      setCompletedCount(nextCompleted);
      setTypedInput("");
      showToast?.(`Completed repetition ${nextCompleted}/${targetCount}!`, "success");

      if (nextCompleted >= targetCount) {
        const timeSpentSecs = startTime ? Math.round((Date.now() - startTime) / 1000) : 30;
        logSpellingSession({
          word: targetWordText,
          repetitionsCompleted: targetCount,
          wpm,
          accuracy,
          timeSpentSeconds: timeSpentSecs,
        }).catch(() => {});

        showToast?.(`🎉 Finished ${targetCount} repetitions of "${targetWordText}"! Logged to DB.`, "success");
      }
    }
  };

  const resetCurrentTrainer = () => {
    setTypedInput("");
    setCompletedCount(0);
    setStartTime(null);
    setTotalKeystrokes(0);
    setErrorCount(0);
    setWpm(0);
    setAccuracy(100);
    if (inputRef.current) inputRef.current.focus();
  };

  // Add Single Word to DB
  const handleAddSingleWord = async (e) => {
    e.preventDefault();
    if (!singleWord.word.trim() || !singleWord.meaning.trim()) return;

    try {
      await addVocabularyWord(singleWord);
      showToast?.(`Added "${singleWord.word}" to DB!`, "success");
      setSingleWord({ word: "", meaning: "", pronunciation: "", difficulty: "Medium", category: "General" });
      setShowAddModal(false);
      fetchNextWord();
    } catch {
      showToast?.("Failed to add word to database", "error");
    }
  };

  // Handle CSV Upload
  const handleCsvFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r\n|\n/);
      const parsed = [];

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
        if (idx === 0 && parts[0].toLowerCase() === "word") return;

        if (parts[0]) {
          parsed.push({
            word: parts[0],
            meaning: parts[1] || "Vocabulary word",
            pronunciation: parts[2] || "",
            difficulty: parts[3] || "Medium",
            category: parts[4] || "General",
          });
        }
      });

      setCsvPreview(parsed);
      showToast?.(`Parsed ${parsed.length} words from CSV file`, "info");
    };

    reader.readAsText(file);
  };

  // Import CSV Preview to DB
  const handleImportCsvWords = async () => {
    if (csvPreview.length === 0) return;

    try {
      await addVocabularyBulk(csvPreview);
      showToast?.(`Successfully imported ${csvPreview.length} words into MongoDB!`, "success");
      setCsvPreview([]);
      setCsvFileName("");
      setShowAddModal(false);
      fetchNextWord();
    } catch {
      showToast?.("Failed to bulk import words to database", "error");
    }
  };

  return (
    <div className="spelling-container">
      {/* HEADER BAR & CONTROLS */}
      <div className="spelling-header-card">
        <div>
          <span className="spelling-kicker">⌨️ Spelling Repetition & Typing Speed Trainer</span>
          <h2>Practice & Master Spelling</h2>
          <p>Type each word 20 times to build muscle memory and track your real-time Typing WPM speed!</p>
        </div>

        <div className="spelling-header-actions">
          <button className="em-primary-btn" onClick={() => setShowAddModal(true)} type="button">
            + Add Words (Single / CSV Bulk)
          </button>
        </div>
      </div>

      {/* TYPING TRAINER DASHBOARD */}
      {loading ? (
        <div className="spelling-word-card">
          <p>Fetching random word from database...</p>
        </div>
      ) : currentWord ? (
        <div className="spelling-trainer-grid">
          {/* WORD DISPLAY CARD */}
          <div className="spelling-word-card">
            <div className="word-card-top">
              <span className="diff-badge">{currentWord.difficulty || "Medium"}</span>
              <button className="audio-speak-btn" onClick={speakCurrentWord} type="button" title="Listen Audio">
                🔊 Listen
              </button>
            </div>

            <div className="target-word-display">
              <h2>{targetWordText}</h2>
              <span className="phonetic-text">{currentWord.pronunciation || currentWord.phonetic}</span>
            </div>

            <p className="word-meaning">"{currentWord.meaning}"</p>

            {/* REPETITION PROGRESS BAR */}
            <div className="rep-counter-section">
              <div className="rep-info">
                <span>Repetitions Completed: <strong>{completedCount} / {targetCount}</strong></span>
                <span>Target: {targetCount} Times</span>
              </div>

              <div className="rep-track">
                <div className="rep-fill" style={{ width: `${Math.min(100, (completedCount / targetCount) * 100)}%` }} />
              </div>

              <div className="target-selector">
                <span>Set Target Repetitions:</span>
                {[5, 10, 20, 30].map((num) => (
                  <button
                    key={num}
                    className={`target-num-btn ${targetCount === num ? "active" : ""}`}
                    onClick={() => setTargetCount(num)}
                    type="button"
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TYPING INPUT CANVAS & LIVE WPM METRICS */}
          <div className="spelling-canvas-card">
            <div className="wpm-metrics-row">
              <div className="wpm-metric-box">
                <span className="wpm-num">{wpm}</span>
                <span className="wpm-lbl">WPM (Speed)</span>
              </div>
              <div className="wpm-metric-box">
                <span className="wpm-num">{accuracy}%</span>
                <span className="wpm-lbl">Accuracy</span>
              </div>
              <div className="wpm-metric-box">
                <span className="wpm-num">{errorCount}</span>
                <span className="wpm-lbl">Errors</span>
              </div>
            </div>

            {/* LIVE LETTER HIGHLIGHTING PREVIEW */}
            <div className="letter-highlight-display">
              {targetWordText.split("").map((char, index) => {
                let charClass = "char-pending";
                if (index < typedInput.length) {
                  charClass =
                    typedInput[index].toLowerCase() === char.toLowerCase()
                      ? "char-correct"
                      : "char-incorrect";
                }
                return (
                  <span key={index} className={`char-box ${charClass}`}>
                    {char}
                  </span>
                );
              })}
            </div>

            {/* TYPING INPUT BOX */}
            <input
              ref={inputRef}
              className="spelling-type-input"
              type="text"
              placeholder={`Type "${targetWordText}" here...`}
              value={typedInput}
              onChange={handleInputChange}
              autoComplete="off"
              spellCheck="false"
            />

            <div className="spelling-controls-row">
              <button className="em-secondary-btn" onClick={resetCurrentTrainer} type="button">
                🔄 Reset Repetitions
              </button>
              <button className="em-primary-btn" onClick={fetchNextWord} type="button">
                Next Word →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="spelling-word-card" style={{ textAlign: "center", padding: "40px" }}>
          <h3>No Vocabulary Words in Database Yet</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
            Click <strong>+ Add Words</strong> above to insert single words or bulk upload a CSV file into MongoDB!
          </p>
          <button className="em-primary-btn" style={{ marginTop: "16px" }} onClick={() => setShowAddModal(true)} type="button">
            + Add Words to DB
          </button>
        </div>
      )}

      {/* ADD WORD / BULK CSV MODAL */}
      {showAddModal && (
        <div className="em-modal-overlay">
          <div className="em-modal-card spelling-add-modal">
            <div className="modal-tab-header">
              <button
                className={`modal-tab-btn ${activeAddTab === "single" ? "active" : ""}`}
                onClick={() => setActiveAddTab("single")}
                type="button"
              >
                ✏️ Add Single Word to DB
              </button>
              <button
                className={`modal-tab-btn ${activeAddTab === "csv" ? "active" : ""}`}
                onClick={() => setActiveAddTab("csv")}
                type="button"
              >
                📁 Bulk Import via CSV
              </button>
            </div>

            {activeAddTab === "single" ? (
              <form onSubmit={handleAddSingleWord} className="em-modal-form">
                <div className="form-row">
                  <label>
                    Word
                    <input
                      type="text"
                      required
                      placeholder="e.g. Perseverance"
                      value={singleWord.word}
                      onChange={(e) => setSingleWord({ ...singleWord, word: e.target.value })}
                    />
                  </label>
                  <label>
                    Pronunciation
                    <input
                      type="text"
                      placeholder="/ˌpɜː.sɪˈvɪə.rəns/"
                      value={singleWord.pronunciation}
                      onChange={(e) => setSingleWord({ ...singleWord, pronunciation: e.target.value })}
                    />
                  </label>
                </div>

                <label>
                  Meaning
                  <textarea
                    required
                    placeholder="Definition..."
                    value={singleWord.meaning}
                    onChange={(e) => setSingleWord({ ...singleWord, meaning: e.target.value })}
                  />
                </label>

                <div className="form-row">
                  <label>
                    Difficulty
                    <select
                      value={singleWord.difficulty}
                      onChange={(e) => setSingleWord({ ...singleWord, difficulty: e.target.value })}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </label>
                </div>

                <div className="modal-actions">
                  <button className="em-secondary-btn" onClick={() => setShowAddModal(false)} type="button">
                    Cancel
                  </button>
                  <button className="em-primary-btn" type="submit">
                    Save Word to DB
                  </button>
                </div>
              </form>
            ) : (
              <div className="csv-upload-section">
                <div className="csv-dropzone">
                  <span className="csv-icon">📄</span>
                  <h4>Upload Vocabulary CSV File</h4>
                  <p>Format: <code>word, meaning, pronunciation, difficulty</code></p>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    id="csv-file-input"
                    className="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="em-primary-btn csv-btn">
                    Choose CSV File
                  </label>
                  {csvFileName && <span className="csv-file-name">Selected: {csvFileName}</span>}
                </div>

                {csvPreview.length > 0 && (
                  <div className="csv-preview-table-wrap">
                    <h4>Preview Parsed Words ({csvPreview.length} items)</h4>
                    <table className="csv-table">
                      <thead>
                        <tr>
                          <th>Word</th>
                          <th>Meaning</th>
                          <th>Pronunciation</th>
                          <th>Difficulty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 5).map((w, idx) => (
                          <tr key={idx}>
                            <td><strong>{w.word}</strong></td>
                            <td>{w.meaning}</td>
                            <td>{w.pronunciation}</td>
                            <td>{w.difficulty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.length > 5 && (
                      <p className="more-preview-text">+ {csvPreview.length - 5} more words ready to import</p>
                    )}

                    <div className="modal-actions">
                      <button className="em-secondary-btn" onClick={() => setShowAddModal(false)} type="button">
                        Cancel
                      </button>
                      <button className="em-primary-btn" onClick={handleImportCsvWords} type="button">
                        Import {csvPreview.length} Words to DB ✓
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpellingView;
