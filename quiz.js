// ===== GLOBAL STATE =====
let allCharacters = [];
let allWords = [];
let allPhrases = [];
let currentQuestion;
let correctAnswer;
let score = parseInt(localStorage.getItem("quizScore") || "0");
let streak = parseInt(localStorage.getItem("quizStreak") || "0");
let totalAnswered = parseInt(localStorage.getItem("quizTotal") || "0");
let correctTotal = parseInt(localStorage.getItem("quizCorrect") || "0");

// ===== QUIZ TYPE =====
let quizType = localStorage.getItem("quizType") || "charToSound";

// ===== LOAD DATA =====
async function loadData() {
  try {
    // Load characters from data_farsi.json
    const charRes = await fetch("data_farsi.json");
    const charJson = await charRes.json();
    if (charJson.characters) {
      allCharacters = charJson.characters.filter(c => c.char && c.sound);
    }
    console.log("Characters loaded:", allCharacters.length);

    // Load words & phrases from typing_database.json
    const dbRes = await fetch("typing_database.json");
    const dbJson = await dbRes.json();
    allWords = (dbJson.words || []).filter(w => w.word && w.meaning);
    allPhrases = (dbJson.phrases || []).filter(p => p.word && p.meaning);
    console.log("Words loaded:", allWords.length, "Phrases loaded:", allPhrases.length);

    updateScoreDisplay();
    setActiveType(quizType);
    nextQuestion();

  } catch (err) {
    console.error("Error loading data:", err);
    showError("Failed to load quiz data. Make sure you're running from a local server.");
  }
}

// ===== DISPLAY ERROR =====
function showError(msg) {
  const container = document.querySelector(".quiz-container") || document.querySelector(".container");
  if (container) {
    container.innerHTML = `<div class="quiz-error"><p>⚠️ ${msg}</p></div>`;
  }
}

// ===== SET QUIZ TYPE =====
function setQuizType(type) {
  quizType = type;
  localStorage.setItem("quizType", type);
  setActiveType(type);

  // Reset question display
  const resultEl = document.getElementById("result");
  const nextBtn = document.getElementById("nextBtn");
  if (resultEl) resultEl.textContent = "";
  if (nextBtn) nextBtn.style.display = "none";

  nextQuestion();
}

function setActiveType(type) {
  document.querySelectorAll(".quiz-type-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
}

// ===== GET RANDOM FORM =====
function getRandomForm(obj) {
  const forms = [obj.isolated, obj.initial, obj.medial, obj.final].filter(Boolean);
  return forms.length > 0 ? forms[Math.floor(Math.random() * forms.length)] : obj.char;
}

// ===== GET POOL =====
function getPool() {
  if (quizType === "charToSound" || quizType === "soundToChar") return allCharacters;
  if (quizType === "phraseToMeaning" || quizType === "meaningToPhrase") return allPhrases;
  return allWords; // wordToMeaning, meaningToWord
}

// ===== GENERATE QUESTION =====
function nextQuestion() {
  const resultEl = document.getElementById("result");
  const nextBtn = document.getElementById("nextBtn");
  const questionEl = document.getElementById("questionChar");
  const questionHintEl = document.getElementById("questionHint");

  if (resultEl) resultEl.textContent = "";
  if (nextBtn) nextBtn.style.display = "none";
  if (questionHintEl) questionHintEl.textContent = "";

  const pool = getPool();
  if (pool.length === 0) {
    if (questionEl) questionEl.textContent = "No data available for this quiz type.";
    return;
  }

  currentQuestion = randomFrom(pool);

  if (quizType === "charToSound") {
    if (questionEl) {
      questionEl.textContent = getRandomForm(currentQuestion);
      questionEl.className = "question-display farsi-large";
    }
    if (questionHintEl) questionHintEl.textContent = "What sound does this letter make?";
    correctAnswer = currentQuestion.sound;

  } else if (quizType === "soundToChar") {
    if (questionEl) {
      questionEl.textContent = currentQuestion.sound;
      questionEl.className = "question-display latin-display";
    }
    if (questionHintEl) questionHintEl.textContent = "Which letter makes this sound?";
    correctAnswer = getRandomForm(currentQuestion);

  } else if (quizType === "wordToMeaning") {
    if (questionEl) {
      questionEl.textContent = cleanWord(currentQuestion.word);
      questionEl.className = "question-display farsi-large";
    }
    if (questionHintEl) questionHintEl.textContent = currentQuestion.translit ? `(${currentQuestion.translit})` : "";
    correctAnswer = currentQuestion.meaning;

  } else if (quizType === "meaningToWord") {
    if (questionEl) {
      questionEl.textContent = currentQuestion.meaning;
      questionEl.className = "question-display latin-display";
    }
    if (questionHintEl) questionHintEl.textContent = "Type the Persian word";
    correctAnswer = cleanWord(currentQuestion.word);

  } else if (quizType === "phraseToMeaning") {
    if (questionEl) {
      questionEl.textContent = cleanWord(currentQuestion.word);
      questionEl.className = "question-display farsi-medium";
    }
    if (questionHintEl) questionHintEl.textContent = currentQuestion.translit ? `(${currentQuestion.translit})` : "";
    correctAnswer = currentQuestion.meaning;

  } else if (quizType === "meaningToPhrase") {
    if (questionEl) {
      questionEl.textContent = currentQuestion.meaning;
      questionEl.className = "question-display latin-display";
    }
    if (questionHintEl) questionHintEl.textContent = "Choose the Persian phrase";
    correctAnswer = cleanWord(currentQuestion.word);
  }

  generateOptions(pool);
}

// ===== GENERATE OPTIONS =====
function generateOptions(pool) {
  let options = [correctAnswer];
  let attempts = 0;
  const maxAttempts = 200;
  const targetCount = Math.min(4, pool.length);

  while (options.length < targetCount && attempts < maxAttempts) {
    attempts++;
    const rand = randomFrom(pool);
    let value;

    if (quizType === "charToSound") {
      value = rand.sound;
    } else if (quizType === "soundToChar") {
      value = getRandomForm(rand);
    } else if (quizType === "wordToMeaning" || quizType === "phraseToMeaning") {
      value = rand.meaning;
    } else {
      value = cleanWord(rand.word);
    }

    if (value && !options.includes(value)) {
      options.push(value);
    }
  }

  // Shuffle options
  options.sort(() => Math.random() - 0.5);

  const optionsDiv = document.getElementById("options");
  if (!optionsDiv) return;
  optionsDiv.innerHTML = "";

  // Determine if answer is Farsi (for RTL styling)
  const isFarsiAnswer = quizType === "soundToChar" || quizType === "meaningToWord" || quizType === "meaningToPhrase";

  options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "option-btn" + (isFarsiAnswer ? " farsi-option" : "");
    btn.setAttribute("data-value", option);
    btn.onclick = () => checkAnswer(option);
    optionsDiv.appendChild(btn);
  });
}

// ===== CHECK ANSWER =====
function checkAnswer(selected) {
  const resultEl = document.getElementById("result");
  const nextBtn = document.getElementById("nextBtn");
  const buttons = document.querySelectorAll(".option-btn");

  totalAnswered++;
  localStorage.setItem("quizTotal", totalAnswered);

  if (selected === correctAnswer) {
    score++;
    streak++;
    correctTotal++;
    localStorage.setItem("quizScore", score);
    localStorage.setItem("quizStreak", streak);
    localStorage.setItem("quizCorrect", correctTotal);

    if (resultEl) {
      resultEl.innerHTML = `✅ Correct! ${streak > 1 ? `<span class="streak-badge">🔥 ${streak} streak</span>` : ""}`;
      resultEl.className = "result-display result-correct";
    }
  } else {
    score = Math.max(0, score - 1);
    streak = 0;
    localStorage.setItem("quizScore", score);
    localStorage.setItem("quizStreak", "0");

    if (resultEl) {
      resultEl.innerHTML = `❌ Wrong! Correct: <strong>${correctAnswer}</strong>`;
      resultEl.className = "result-display result-wrong";
    }
  }

  updateScoreDisplay();

  if (nextBtn) nextBtn.style.display = "inline-flex";

  // Highlight buttons
  buttons.forEach(btn => {
    btn.disabled = true;
    const val = btn.getAttribute("data-value");
    if (val === correctAnswer) {
      btn.classList.add("btn-correct");
    } else if (val === selected && selected !== correctAnswer) {
      btn.classList.add("btn-wrong");
    }
  });
}

// ===== UPDATE SCORE DISPLAY =====
function updateScoreDisplay() {
  const scoreEl = document.getElementById("score");
  const streakEl = document.getElementById("streakCount");
  const accuracyEl = document.getElementById("accuracyPct");

  if (scoreEl) scoreEl.textContent = score;
  if (streakEl) streakEl.textContent = streak;
  if (accuracyEl && totalAnswered > 0) {
    accuracyEl.textContent = Math.round((correctTotal / totalAnswered) * 100) + "%";
  } else if (accuracyEl) {
    accuracyEl.textContent = "—";
  }
}

// ===== RESET SCORE =====
function resetScore() {
  score = 0;
  streak = 0;
  totalAnswered = 0;
  correctTotal = 0;
  localStorage.setItem("quizScore", "0");
  localStorage.setItem("quizStreak", "0");
  localStorage.setItem("quizTotal", "0");
  localStorage.setItem("quizCorrect", "0");
  updateScoreDisplay();
}

// ===== HELPERS =====
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cleanWord(word) {
  if (!word) return "";
  return word.includes("(") ? word.split("(")[0].trim() : word;
}

// ===== START =====
loadData();