import { useState, useEffect, useCallback } from "react";
import { generateQuiz, submitQuizAnswers } from "../englishApi";
import "./Quiz.css";

const defaultQuizQuestions = [
  {
    id: 1,
    question: "Select the word that best completes the sentence: 'Her explanation was so _____ that everyone immediately understood the complex concept.'",
    options: [
      { id: "A", text: "Lucid" },
      { id: "B", text: "Ambiguous" },
      { id: "C", text: "Obscure" },
      { id: "D", text: "Perplexing" },
    ],
    correct: "A",
    explanation: "'Lucid' means clear and easy to understand. 'Ambiguous' and 'obscure' mean vague or unclear.",
  },
  {
    id: 2,
    question: "Identify the grammatically correct sentence:",
    options: [
      { id: "A", text: "Neither of the candidates have submitted their resume." },
      { id: "B", text: "Neither of the candidates has submitted their resume." },
      { id: "C", text: "Neither of the candidates were submitting resumes." },
      { id: "D", text: "Neither of candidates has submit their resume." },
    ],
    correct: "B",
    explanation: "'Neither' is a singular pronoun and takes the singular verb 'has'.",
  },
  {
    id: 3,
    question: "What is the synonym of 'Pragmatic'?",
    options: [
      { id: "A", text: "Idealistic" },
      { id: "B", text: "Practical" },
      { id: "C", text: "Theoretical" },
      { id: "D", text: "Irrational" },
    ],
    correct: "B",
    explanation: "'Pragmatic' refers to dealing with things sensibly and practically.",
  },
  {
    id: 4,
    question: "Choose the correct idiom meaning 'to face a difficult situation with courage':",
    options: [
      { id: "A", text: "Bite the bullet" },
      { id: "B", text: "Break a leg" },
      { id: "C", text: "Burn the midnight oil" },
      { id: "D", text: "Spill the beans" },
    ],
    correct: "A",
    explanation: "'Bite the bullet' means to endure a painful or difficult situation with courage.",
  },
  {
    id: 5,
    question: "Which word is an antonym for 'Ubiquitous'?",
    options: [
      { id: "A", text: "Omnipresent" },
      { id: "B", text: "Pervasive" },
      { id: "C", text: "Rare" },
      { id: "D", text: "Universal" },
    ],
    correct: "C",
    explanation: "'Ubiquitous' means found everywhere. 'Rare' is its opposite.",
  },
];

const QuizView = ({ showToast }) => {
  const [questions, setQuestions] = useState(defaultQuizQuestions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total
  const [isFinished, setIsFinished] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [apiResult, setApiResult] = useState(null);

  const currentQ = questions[currentIdx] || defaultQuizQuestions[0];

  useEffect(() => {
    generateQuiz({ count: 5, category: "Vocabulary" })
      .then((data) => {
        if (data?._id || data?.id) {
          setQuizId(data._id || data.id);
        }
        if (data?.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        }
      })
      .catch((err) => {
        console.log("Using default local quiz fallback", err);
      });
  }, []);

  const finishQuiz = useCallback(async () => {
    setIsFinished(true);
    showToast?.("Quiz Submitted! Viewing Assessment Results.", "success");

    if (quizId) {
      try {
        const formattedAnswers = Object.entries(userAnswers).map(([qId, ans]) => {
          const qIndex = questions.findIndex((q) => (q.id || q._id || String(q.question)) === qId);
          return { questionIndex: qIndex >= 0 ? qIndex : 0, userAnswer: ans };
        });

        const res = await submitQuizAnswers(quizId, formattedAnswers);
        if (res) {
          setApiResult(res);
        }
      } catch (err) {
        console.log("Submitting quiz answers locally fallback", err);
      }
    }
  }, [quizId, userAnswers, questions, showToast]);

  // Timer Effect
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, finishQuiz]);

  const handleSelectOption = (optionId) => {
    const qKey = currentQ.id || currentQ._id || String(currentQ.question);
    setUserAnswers((prev) => ({
      ...prev,
      [qKey]: optionId,
    }));
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setUserAnswers({});
    setTimeLeft(180);
    setIsFinished(false);
    setApiResult(null);

    generateQuiz({ count: 5, category: "Vocabulary" })
      .then((data) => {
        if (data?._id || data?.id) setQuizId(data._id || data.id);
        if (data?.questions && Array.isArray(data.questions)) setQuestions(data.questions);
      })
      .catch(() => {});
  };

  // Calculation for results
  const correctCount = questions.reduce((acc, q) => {
    const qKey = q.id || q._id || String(q.question);
    return userAnswers[qKey] === q.correct ? acc + 1 : acc;
  }, 0);

  const accuracyPercent = apiResult?.percentage ?? Math.round((correctCount / questions.length) * 100);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="quiz-container">
      {!isFinished ? (
        <div className="quiz-main-card">
          {/* TOP BAR & TIMER */}
          <div className="quiz-top-bar">
            <div>
              <span className="quiz-kicker">🎯 POST /api/english/quiz/generate</span>
              <h2>Question {currentIdx + 1} of {questions.length}</h2>
            </div>

            <div className="quiz-timer-badge">
              ⏱️ {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="quiz-progress-track">
            <div
              className="quiz-progress-bar"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* QUESTION BOX */}
          <div className="quiz-question-box">
            <h3>{currentQ.question}</h3>

            <div className="quiz-options-list">
              {(currentQ.options || []).map((opt) => {
                const optId = typeof opt === "string" ? opt : opt.id || opt.text;
                const optText = typeof opt === "string" ? opt : opt.text;
                const qKey = currentQ.id || currentQ._id || String(currentQ.question);
                const isSelected = userAnswers[qKey] === optId;

                return (
                  <button
                    key={optId}
                    className={`quiz-option-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectOption(optId)}
                    type="button"
                  >
                    <span className="opt-key">{optId.slice(0, 1)}</span>
                    <span className="opt-text">{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUESTION NAVIGATOR GRID & ACTIONS */}
          <div className="quiz-bottom-nav">
            <div className="question-nav-pills">
              {questions.map((q, idx) => {
                const qKey = q.id || q._id || String(q.question);
                const isAnswered = !!userAnswers[qKey];
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={idx}
                    className={`nav-pill ${isCurrent ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                    onClick={() => setCurrentIdx(idx)}
                    type="button"
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="quiz-action-btns">
              <button
                className="em-secondary-btn"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                type="button"
              >
                ← Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  className="em-primary-btn"
                  onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
                  type="button"
                >
                  Next Question →
                </button>
              ) : (
                <button className="em-primary-btn finish" onClick={finishQuiz} type="button">
                  Submit Quiz ✓
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* RESULT PAGE */
        <div className="quiz-result-card">
          <div className="result-header">
            <div className="result-badge">
              <span>{accuracyPercent}%</span>
              <small>Accuracy Score</small>
            </div>
            <h2>Quiz Completed!</h2>
            <p>You answered <strong>{correctCount} out of {questions.length}</strong> questions correctly.</p>
            <button className="em-primary-btn" onClick={restartQuiz} type="button">
              🔄 Generate New Quiz
            </button>
          </div>

          {/* DETAILED ANSWER REVIEW */}
          <div className="answer-review-section">
            <h3>📖 Answer Review & Explanations</h3>
            <div className="review-list">
              {questions.map((q, idx) => {
                const qKey = q.id || q._id || String(q.question);
                const userAns = userAnswers[qKey];
                const isCorrect = userAns === q.correct;

                return (
                  <div key={idx} className={`review-item ${isCorrect ? "correct" : "wrong"}`}>
                    <div className="review-item-header">
                      <span>Question {idx + 1}</span>
                      <span className={`status-tag ${isCorrect ? "pass" : "fail"}`}>
                        {isCorrect ? "✓ Correct" : "✕ Incorrect"}
                      </span>
                    </div>
                    <h4>{q.question}</h4>
                    <p className="ans-comparison">
                      Your Answer: <strong>{userAns ? `${userAns}` : "Not Answered"}</strong> | Correct Answer: <strong>{q.correct}</strong>
                    </p>
                    <p className="exp-text">💡 <strong>Explanation:</strong> {q.explanation || "Correct option is " + q.correct}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
