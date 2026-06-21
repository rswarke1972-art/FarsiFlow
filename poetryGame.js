let poem = null;
let allPoemWords = [];
let currentVerse = null;
let targetMissingWord = "";
let correctCleanWord = "";
let score = 0;

// DOM Elements
const gamePoemTitle = document.getElementById("gamePoemTitle");
const scoreDisplay = document.getElementById("scoreDisplay");
const incompleteVerse = document.getElementById("incompleteVerse");
const verseTranslation = document.getElementById("verseTranslation");
const optionsGrid = document.getElementById("optionsGrid");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");

// ===== LOAD GAME DATA =====
async function initGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const poemId = urlParams.get("id");
  
  if (!poemId) {
    incompleteVerse.innerText = "No Poem Selected";
    return;
  }

  try {
    const res = await fetch("poetry_farsi.json");
    const json = await res.json();
    
    poem = json.poems.find(p => p.id === poemId);
    
    if (!poem) {
      incompleteVerse.innerText = "Poem Not Found";
      return;
    }

    gamePoemTitle.innerText = poem.title;
    
    // Extract all unique clean words from the poem to use as options distractors
    const wordSet = new Set();
    poem.verses.forEach(v => {
      v.farsi.split(/\s+/).forEach(w => {
        const clean = cleanWord(w);
        if (clean.length > 2) {
          wordSet.add(clean);
        }
      });
    });
    allPoemWords = Array.from(wordSet);
    
    // Load score from localStorage if available
    score = parseInt(localStorage.getItem("poetryGameScore") || "0");
    scoreDisplay.innerText = "Score: " + score;

    generateQuestion();
  } catch (err) {
    console.error("Error starting poetry game:", err);
  }
}

// ===== CLEAN WORD =====
function cleanWord(word) {
  if (!word) return "";
  let clean = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،؛«»"']/g, "").trim();
  // Normalize Arabic variants to standard Farsi
  clean = clean.replace(/\u064a/g, "\u06cc"); // Arabic Yeh to Farsi Yeh
  clean = clean.replace(/\u0649/g, "\u06cc"); // Arabic Alif Maksura to Farsi Yeh
  clean = clean.replace(/\u0643/g, "\u06a9"); // Arabic Kaf to Farsi Keheh
  return clean;
}

// ===== GENERATE QUESTION =====
function generateQuestion() {
  nextQuestionBtn.style.display = "none";
  optionsGrid.innerHTML = "";
  
  // Pick a random verse
  currentVerse = poem.verses[Math.floor(Math.random() * poem.verses.length)];
  
  // Get all valid words in this verse that are longer than 2 characters
  const verseWords = currentVerse.farsi.split(/\s+/);
  const candidates = verseWords.map(w => cleanWord(w)).filter(w => w.length > 2);
  
  // Fallback if no long words
  if (candidates.length === 0) {
    generateQuestion();
    return;
  }
  
  // Pick the target missing word
  correctCleanWord = candidates[Math.floor(Math.random() * candidates.length)];
  
  // Re-build the verse string, replacing the target word with blanks
  // We want to replace precisely the word, preserving other punctuation
  let maskedLine = currentVerse.farsi;
  verseWords.forEach(w => {
    if (cleanWord(w) === correctCleanWord) {
      maskedLine = maskedLine.replace(w, "________");
    }
  });

  incompleteVerse.innerText = maskedLine;
  verseTranslation.innerText = "Hint: " + currentVerse.english;
  
  generateOptions();
}

// ===== GENERATE OPTIONS =====
function generateOptions() {
  let options = [correctCleanWord];
  let attempts = 0;
  
  // Generate 3 unique distractors from the poem vocabulary
  while (options.length < 4 && attempts < 100) {
    attempts++;
    const randWord = allPoemWords[Math.floor(Math.random() * allPoemWords.length)];
    if (randWord && !options.includes(randWord)) {
      options.push(randWord);
    }
  }

  // Shuffle options
  options.sort(() => Math.random() - 0.5);

  // Render buttons
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.className = "action-btn";
    btn.style.fontFamily = "var(--font-arabic)";
    btn.style.fontSize = "20px";
    btn.style.background = "var(--bg-secondary)";
    btn.style.color = "var(--text-primary)";
    btn.style.border = "1px solid var(--bg-accent)";
    
    btn.addEventListener("click", () => checkAnswer(opt, btn));
    optionsGrid.appendChild(btn);
  });
}

// ===== CHECK ANSWER =====
function checkAnswer(selected, selectedBtn) {
  const buttons = optionsGrid.querySelectorAll("button");
  
  // Disable all options
  buttons.forEach(btn => {
    btn.disabled = true;
    
    // Highlight correct answer in green
    if (btn.innerText === correctCleanWord) {
      btn.style.background = "var(--color-success)";
      btn.style.color = "black";
    }
  });

  if (selected === correctCleanWord) {
    score += 10;
    selectedBtn.style.boxShadow = "0 0 15px var(--color-success)";
    if (navigator.vibrate) navigator.vibrate(20);
  } else {
    score = Math.max(0, score - 5);
    selectedBtn.style.background = "var(--color-error)";
    selectedBtn.style.color = "white";
    selectedBtn.style.boxShadow = "0 0 15px var(--color-error)";
    if (navigator.vibrate) navigator.vibrate([40, 40]);
  }

  // Save and update score display
  localStorage.setItem("poetryGameScore", score);
  scoreDisplay.innerText = "Score: " + score;
  
  // Show Next button
  nextQuestionBtn.style.display = "inline-flex";
}

// ===== START =====
document.addEventListener("DOMContentLoaded", initGame);
