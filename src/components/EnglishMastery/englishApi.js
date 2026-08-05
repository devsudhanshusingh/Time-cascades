import api from "../../api";

// DASHBOARD API
export const getEnglishDashboard = async () => {
  const { data } = await api.get("/api/english/dashboard");
  return data;
};

// VOCABULARY API
export const getVocabularyList = async (params = {}) => {
  const { data } = await api.get("/api/english/vocabulary", { params });
  return data;
};

export const addVocabularyWord = async (wordData) => {
  const { data } = await api.post("/api/english/vocabulary", wordData);
  return data;
};

export const addVocabularyBulk = async (wordsArray) => {
  const { data } = await api.post("/api/english/vocabulary/bulk", { words: wordsArray });
  return data;
};

export const updateVocabularyWord = async (id, wordData) => {
  const { data } = await api.put(`/api/english/vocabulary/${id}`, wordData);
  return data;
};

export const deleteVocabularyWord = async (id) => {
  const { data } = await api.delete(`/api/english/vocabulary/${id}`);
  return data;
};

export const toggleWordLearned = async (id, learnedState) => {
  const payload = learnedState !== undefined ? { learned: learnedState } : {};
  const { data } = await api.patch(`/api/english/vocabulary/${id}/learned`, payload);
  return data;
};

export const toggleWordFavorite = async (id, favoriteState) => {
  const payload = favoriteState !== undefined ? { favorite: favoriteState } : {};
  const { data } = await api.patch(`/api/english/vocabulary/${id}/favorite`, payload);
  return data;
};

export const getRandomVocabularyWord = async (params = {}) => {
  const { data } = await api.get("/api/english/vocabulary/random", { params });
  return data;
};

// SPELLING LOG API
export const logSpellingSession = async (sessionData) => {
  const { data } = await api.post("/api/english/spelling/log", sessionData);
  return data;
};

// JOURNAL API
export const getJournalEntries = async (params = {}) => {
  const { data } = await api.get("/api/english/journal", { params });
  return data;
};

export const getJournalHistory = async () => {
  const { data } = await api.get("/api/english/journal/history");
  return data;
};

export const createJournalEntry = async (journalData) => {
  const { data } = await api.post("/api/english/journal", journalData);
  return data;
};

export const updateJournalEntry = async (id, journalData) => {
  const { data } = await api.put(`/api/english/journal/${id}`, journalData);
  return data;
};

export const deleteJournalEntry = async (id) => {
  const { data } = await api.delete(`/api/english/journal/${id}`);
  return data;
};

// ROUTINE API
export const getTodayRoutine = async () => {
  const { data } = await api.get("/api/english/routine/today");
  return data;
};

export const logRoutineProgress = async (routineData) => {
  const { data } = await api.post("/api/english/routine", routineData);
  return data;
};

export const getRoutineStats = async () => {
  const { data } = await api.get("/api/english/routine/stats");
  return data;
};

// QUIZ API
export const generateQuiz = async (quizParams = { count: 5, category: "Vocabulary" }) => {
  const { data } = await api.post("/api/english/quiz/generate", quizParams);
  return data;
};

export const submitQuizAnswers = async (quizId, answers) => {
  const { data } = await api.post(`/api/english/quiz/${quizId}/submit`, { answers });
  return data;
};

export const getQuizHistory = async (params = {}) => {
  const { data } = await api.get("/api/english/quiz/history", { params });
  return data;
};

// ANALYTICS & ACHIEVEMENTS API
export const getAnalyticsData = async () => {
  const { data } = await api.get("/api/english/analytics");
  return data;
};

export const getAchievementsData = async () => {
  const { data } = await api.get("/api/english/achievements");
  return data;
};
