import { useState, useMemo, useEffect, useCallback } from "react";
import {
  getVocabularyList,
  addVocabularyWord,
  updateVocabularyWord,
  deleteVocabularyWord,
  toggleWordLearned,
  toggleWordFavorite,
  getRandomVocabularyWord,
} from "../englishApi";
import "./Vocabulary.css";

const categories = ["All", "Personality", "Academic", "Communication", "Business", "Media", "Technology", "General"];

const VocabularyView = ({ showToast }) => {
  const [vocabList, setVocabList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    word: "",
    pronunciation: "",
    meaning: "",
    example: "",
    difficulty: "Medium",
    category: "General",
  });

  useEffect(() => {
    let active = true;
    getVocabularyList({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    })
      .then((res) => {
        if (active) {
          const list = res?.data || res || [];
          setVocabList(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (active) setVocabList([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, searchTerm, selectedDifficulty, selectedCategory]);

  const dailyWord = useMemo(() => {
    return vocabList[0] || null;
  }, [vocabList]);

  const speakWord = (text) => {
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
      showToast?.(`Pronouncing: "${text}"`, "info");
    } else {
      showToast?.("Speech Synthesis not supported in browser", "error");
    }
  };

  const handleGetRandomWord = () => {
    getRandomVocabularyWord({
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
    })
      .then((wordData) => {
        if (wordData?.word) {
          speakWord(wordData.word);
          showToast?.(`Random Word: ${wordData.word} - ${wordData.meaning}`, "success");
        } else {
          showToast?.("No words in DB yet", "info");
        }
      })
      .catch(() => {
        showToast?.("No words in DB yet. Click + Add Word!", "info");
      });
  };

  const handleOpenAdd = () => {
    setEditingWord(null);
    setFormData({
      word: "",
      pronunciation: "",
      meaning: "",
      example: "",
      difficulty: "Medium",
      category: "General",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingWord(item);
    setFormData({
      word: item.word,
      pronunciation: item.pronunciation || item.phonetic || "",
      meaning: item.meaning,
      example: item.example || "",
      difficulty: item.difficulty || "Medium",
      category: item.category || "General",
    });
    setShowModal(true);
  };

  const reloadVocabList = useCallback(() => {
    getVocabularyList({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      difficulty: selectedDifficulty !== "All" ? selectedDifficulty : undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    })
      .then((res) => {
        const list = res?.data || res || [];
        setVocabList(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [currentPage, searchTerm, selectedDifficulty, selectedCategory]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.word.trim() || !formData.meaning.trim()) return;

    try {
      if (editingWord) {
        await updateVocabularyWord(editingWord.id || editingWord._id, formData);
        showToast?.(`Updated word "${formData.word}" in DB`, "success");
      } else {
        await addVocabularyWord(formData);
        showToast?.(`Saved "${formData.word}" to DB!`, "success");
      }
      reloadVocabList();
    } catch {
      showToast?.("Failed to save word to database", "error");
    }
    setShowModal(false);
  };

  const handleDelete = async (id, word) => {
    try {
      await deleteVocabularyWord(id);
      showToast?.(`Deleted word "${word}" from DB`, "info");
      reloadVocabList();
    } catch {
      showToast?.("Failed to delete word from database", "error");
    }
  };

  const handleToggleFavorite = async (id, currentFav) => {
    try {
      await toggleWordFavorite(id, !currentFav);
      reloadVocabList();
    } catch (err) {
      console.log("Toggle favorite error", err);
    }
  };

  const handleToggleLearned = async (id, currentLearned) => {
    try {
      await toggleWordLearned(id, !currentLearned);
      reloadVocabList();
    } catch (err) {
      console.log("Toggle learned error", err);
    }
  };

  const filteredVocab = useMemo(() => {
    return vocabList.filter((item) => {
      const matchesSearch =
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchesDiff = selectedDifficulty === "All" || item.difficulty === selectedDifficulty;
      return matchesSearch && matchesCat && matchesDiff;
    });
  }, [vocabList, searchTerm, selectedCategory, selectedDifficulty]);

  const totalPages = Math.ceil(filteredVocab.length / itemsPerPage) || 1;
  const paginatedVocab = filteredVocab.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="vocab-container">
      {/* DAILY WORD HERO CARD */}
      {dailyWord && (
        <div className="vocab-daily-card">
          <div className="vocab-daily-info">
            <span className="vocab-badge-kicker">🌟 Word of the Day</span>
            <h2>
              {dailyWord.word} <small>{dailyWord.pronunciation || dailyWord.phonetic}</small>
            </h2>
            <p className="vocab-daily-meaning">"{dailyWord.meaning}"</p>
            <p className="vocab-daily-example">Example: {dailyWord.example}</p>
          </div>
          <div className="vocab-daily-actions">
            <button className="em-primary-btn" onClick={() => speakWord(dailyWord.word)} type="button">
              🔊 Listen Pronunciation
            </button>
            <button className="em-secondary-btn" onClick={handleGetRandomWord} type="button">
              🎲 Random Word
            </button>
          </div>
        </div>
      )}

      {/* FILTER & CONTROL BAR */}
      <div className="vocab-controls-card">
        <div className="vocab-search-box">
          <input
            type="text"
            placeholder="Search word or meaning in DB..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="vocab-filters">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="All">Difficulty: All</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button className="em-primary-btn" onClick={handleOpenAdd} type="button">
            + Add Word
          </button>
        </div>
      </div>

      {/* SEARCHABLE TABLE */}
      <div className="vocab-table-card">
        <table className="vocab-table">
          <thead>
            <tr>
              <th>Word & Pronunciation</th>
              <th>Meaning & Example</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="vocab-empty">
                  Loading vocabulary from database...
                </td>
              </tr>
            ) : paginatedVocab.length === 0 ? (
              <tr>
                <td colSpan="6" className="vocab-empty">
                  No vocabulary words found in database. Click <strong>+ Add Word</strong> to insert one into MongoDB!
                </td>
              </tr>
            ) : (
              paginatedVocab.map((item) => {
                const itemId = item.id || item._id;
                return (
                  <tr key={itemId} className={item.learned ? "row-learned" : ""}>
                    <td>
                      <div className="word-cell">
                        <button
                          className={`fav-star-btn ${item.favorite ? "active" : ""}`}
                          onClick={() => handleToggleFavorite(itemId, item.favorite)}
                          type="button"
                          title="Favorite"
                        >
                          ★
                        </button>
                        <div>
                          <strong>{item.word}</strong>
                          <span className="phonetic">{item.pronunciation || item.phonetic}</span>
                        </div>
                        <button className="speaker-btn" onClick={() => speakWord(item.word)} type="button" title="Listen">
                          🔊
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="meaning-cell">
                        <p className="meaning">{item.meaning}</p>
                        <p className="example">{item.example}</p>
                      </div>
                    </td>
                    <td>
                      <span className="badge category">{item.category || "General"}</span>
                    </td>
                    <td>
                      <span className={`badge diff ${(item.difficulty || "Medium").toLowerCase()}`}>
                        {item.difficulty || "Medium"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-btn ${item.learned ? "learned" : "pending"}`}
                        onClick={() => handleToggleLearned(itemId, item.learned)}
                        type="button"
                      >
                        {item.learned ? "✓ Learned" : "Pending"}
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="tbl-btn edit" onClick={() => handleOpenEdit(item)} type="button" title="Edit">
                          ✎
                        </button>
                        <button className="tbl-btn danger" onClick={() => handleDelete(itemId, item.word)} type="button" title="Delete">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="vocab-pagination">
          <span>
            Showing page {currentPage} of {totalPages} ({filteredVocab.length} words total in DB)
          </span>
          <div className="page-btns">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              ← Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              type="button"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="em-modal-overlay">
          <div className="em-modal-card">
            <h3>{editingWord ? "Edit Word in DB" : "Add New Vocabulary Word to DB"}</h3>
            <form onSubmit={handleSave} className="em-modal-form">
              <div className="form-row">
                <label>
                  Word
                  <input
                    type="text"
                    required
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    placeholder="e.g. Resilient"
                  />
                </label>
                <label>
                  Pronunciation
                  <input
                    type="text"
                    value={formData.pronunciation}
                    onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                    placeholder="/rɪˈzɪl.jənt/"
                  />
                </label>
              </div>

              <label>
                Meaning
                <textarea
                  required
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  placeholder="Definition..."
                />
              </label>

              <label>
                Example Sentence
                <textarea
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  placeholder="Usage example..."
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Difficulty
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button className="em-secondary-btn" onClick={() => setShowModal(false)} type="button">
                  Cancel
                </button>
                <button className="em-primary-btn" type="submit">
                  Save Word to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;
