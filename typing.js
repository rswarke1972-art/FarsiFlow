// ===== GLOBAL STATE & DATA =====
let typingDatabase = null;
let currentList = [];
let currentWordIndex = 0;
let currentWordObj = null;
let typedText = "";

// Analytics & Stats
let sessionStartTime = null;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let completedCount = 0;
let typedCharactersCount = 0; // for WPM calculation

// Emulator Settings
let emulatorEnabled = false;

// UI Preferences
let showTranslation = true;
let showPronunciation = true;

// ===== DOM SELECTORS =====
const targetWordArabicEl = document.getElementById("targetWordArabic");
const targetWordTranslitEl = document.getElementById("targetWordTranslit");
const targetWordMeaningEl = document.getElementById("targetWordMeaning");
const feedbackContainerEl = document.getElementById("feedbackContainer");
const keyboardInputEl = document.getElementById("keyboardInput");
const completionMessageEl = document.getElementById("completionMessage");
const focusInputBtnEl = document.getElementById("focusInputBtn");
const virtualKeyboardEl = document.getElementById("virtualKeyboard");

// Setup Controls
const categorySelector = document.getElementById("categorySelector");
const lengthSelector = document.getElementById("lengthSelector");
const emulatorToggle = document.getElementById("emulatorToggle");

// Search & Suggestions
const dictSearchInput = document.getElementById("dictSearchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const clearSearchBtn = document.getElementById("clearSearchBtn");

// Stats Widgets
const statsWPMEl = document.getElementById("statsWPM");
const statsAccuracyEl = document.getElementById("statsAccuracy");
const statsProgressEl = document.getElementById("statsProgress");

// View Options
const showTranslationToggle = document.getElementById("showTranslationToggle");
const showTranslitToggle = document.getElementById("showTranslitToggle");

// ===== KEYBOARD MAPPINGS =====
const keyboardRows = [
  ["چ", "ج", "ح", "خ", "ه", "ع", "غ", "ف", "ق", "ث", "ص", "ض"],
  ["گ", "ک", "م", "ن", "ت", "ا", "ل", "ب", "ی", "س", "ش", "پ"],
  ["و", "د", "ذ", "ر", "ز", "ژ", "ط", "ظ", "آ", "ء", "ئ"],
  ["Space", "Backspace"]
];

const farsiToQwertyKeyMap = {
  "ض": "q", "ص": "w", "ث": "e", "ق": "r", "ف": "t", "غ": "y", "ع": "u", "ه": "i", "خ": "o", "ح": "p", "ج": "[", "چ": "]",
  "ش": "a", "س": "s", "ی": "d", "ب": "f", "ل": "g", "ا": "h", "ت": "j", "ن": "k", "م": "l", "ک": ";", "گ": "'", "پ": "m",
  "ظ": "z", "ط": "x", "ز": "c", "ر": "v", "ذ": "b", "د": "n", "و": ",", "ژ": "C", "آ": "H", "ء": "M", "ئ": "D"
};

const qwertyToFarsiMap = {
  'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'چ',
  'a': 'ش', 's': 'س', 'd': 'ی', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ک', "'": 'گ',
  'z': 'ظ', 'x': 'ط', 'c': 'ز', 'v': 'ر', 'b': 'ذ', 'n': 'د', 'm': 'پ', ',': 'و',
  'Q': 'َ', 'W': 'ً', 'E': 'ُ', 'R': 'ٌ', 'T': 'ِ', 'Y': 'ٍ', 'U': '،', 'I': 'ریال', 'O': ']', 'P': '[', '{': '}', '}': '{',
  'A': 'َ', 'S': 'ُ', 'D': 'ئ', 'F': 'ّ', 'G': 'ِ', 'H': 'آ', 'J': 'ـ', 'K': '»', 'L': '«', ':': ':', '"': '؛',
  'Z': 'ة', 'X': 'ی', 'C': 'ژ', 'V': 'ٰ', 'B': '‌', 'N': 'ٔ', 'M': 'ء', '<': '>', '>': '<'
};

// Fallback list of words (original items) in case fetch fails
const fallbackWords = [
  { word: "سلام", meaning: "Hello", translit: "salâm" },
  { word: "دوست", meaning: "Friend", translit: "dust" },
  { word: "عشق", meaning: "Love", translit: "eshgh" },
  { word: "مادر", meaning: "Mother", translit: "mâdar" },
  { word: "پدر", meaning: "Father", translit: "pedar" },
  { word: "کتاب", meaning: "Book", translit: "ketâb" },
  { word: "آب", meaning: "Water", translit: "âb" },
  { word: "خوش آمدید", meaning: "Welcome", translit: "khosh âmadid" }
];

// ===== INITIALIZATION & DATABASE LOADING =====
async function initDatabase() {
  try {
    targetWordArabicEl.innerText = "Loading database...";
    targetWordMeaningEl.innerText = "";
    targetWordTranslitEl.innerText = "";

    const res = await fetch("typing_database.json");
    if (!res.ok) throw new Error("Network response was not ok");
    
    typingDatabase = await res.json();
    console.log("Database loaded successfully:", typingDatabase);
    
    // Inject dynamic option counts in setup dropdowns
    document.querySelector("option[value='words']").innerText = `Words (${typingDatabase.words.length})`;
    document.querySelector("option[value='phrases']").innerText = `Phrases (${typingDatabase.phrases.length})`;
    document.querySelector("option[value='sentences']").innerText = `Sentences (${typingDatabase.sentences.length})`;
  } catch (err) {
    console.error("Failed to fetch typing_database.json, falling back to local list:", err);
    // Construct local fallback database
    typingDatabase = {
      words: fallbackWords,
      phrases: [
        { word: "خدا حافظ", meaning: "Goodbye", translit: "khodâ hâfez" },
        { word: "صبح بخیر", meaning: "Good morning", translit: "sobh bekheyr" },
        { word: "خیلی ممنون", meaning: "Thank you very much", translit: "kheyli mamnun" }
      ],
      sentences: [
        { word: "حال شما چطور است؟", meaning: "How are you?", translit: "hâle shomâ chetor ast?" },
        { word: "من زبان فارسی را دوست دارم.", meaning: "I like Persian language.", translit: "man zabâne fârsi râ dust dâram." }
      ]
    };
  }

  // Load alphabet list dynamically from data_farsi.json
  try {
    const res = await fetch("data_farsi.json");
    if (res.ok) {
      const data = await res.json();
      const alphabetList = [];
      data.characters.forEach(c => {
        if (c.char) {
          alphabetList.push({
            word: c.char,
            meaning: `Letter sound: ${c.sound}`,
            translit: c.sound
          });
        }
        if (c.examples) {
          Object.values(c.examples).forEach(ex => {
            if (ex.word && ex.meaning) {
              const cleanW = ex.word.split("(")[0].trim();
              const cleanT = ex.word.includes("(") ? ex.word.split("(")[1].replace(")", "") : "";
              alphabetList.push({
                word: cleanW,
                meaning: ex.meaning,
                translit: cleanT
              });
            }
          });
        }
      });
      typingDatabase.alphabet = alphabetList;
    }
  } catch (err) {
    console.error("Failed to load data_farsi.json for alphabet examples:", err);
    typingDatabase.alphabet = fallbackWords; // fallback
  }

  // Load preferences from localStorage
  loadSettings();
  
  // Set default category, length filters, and load list
  updateList();
}

// Helper to sanitize target word strings
function sanitizeFarsiText(text) {
  if (!text) return "";
  // Keep Persian letters, spaces, numbers, punctuation
  return text.trim();
}

// ===== STATE & SETTINGS MANAGEMENT =====
function loadSettings() {
  // Emulator
  emulatorEnabled = localStorage.getItem("qwertyEmulator") === "true";
  emulatorToggle.checked = emulatorEnabled;

  // View toggles
  showTranslation = localStorage.getItem("showTranslation") !== "false";
  showTranslationToggle.checked = showTranslation;

  showPronunciation = localStorage.getItem("showPronunciation") !== "false";
  showTranslitToggle.checked = showPronunciation;
  
  updateViewTogglesUI();
}

function updateViewTogglesUI() {
  targetWordMeaningEl.style.display = showTranslation ? "block" : "none";
  targetWordTranslitEl.style.display = showPronunciation ? "block" : "none";
}

function toggleEmulator() {
  emulatorEnabled = emulatorToggle.checked;
  localStorage.setItem("qwertyEmulator", emulatorEnabled);
  initKeyboard(); // Re-render keyboard to show/hide QWERTY keys
  focusInputField();
}

function toggleViewOptions() {
  showTranslation = showTranslationToggle.checked;
  localStorage.setItem("showTranslation", showTranslation);

  showPronunciation = showTranslitToggle.checked;
  localStorage.setItem("showPronunciation", showPronunciation);

  updateViewTogglesUI();
  focusInputField();
}

function changeCategory() {
  updateList();
  focusInputField();
}

function changeFilter() {
  updateList();
  focusInputField();
}

function updateList() {
  const category = categorySelector.value;
  const filter = lengthSelector.value;

  let baseList = typingDatabase[category] || [];

  // Apply length filter
  if (filter === "short") {
    currentList = baseList.filter(item => item.word.length <= 4);
  } else if (filter === "medium") {
    currentList = baseList.filter(item => item.word.length > 4 && item.word.length <= 8);
  } else if (filter === "long") {
    currentList = baseList.filter(item => item.word.length > 8);
  } else {
    currentList = [...baseList];
  }

  // Fallback in case list is empty
  if (currentList.length === 0) {
    currentList = baseList.length > 0 ? [...baseList] : [...fallbackWords];
  }

  // Shuffle current list for variety
  shuffleArray(currentList);

  currentWordIndex = 0;
  loadWord();
  resetStatsDisplay();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ===== STATS CALCULATOR =====
function resetStatsDisplay() {
  sessionStartTime = null;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  completedCount = 0;
  typedCharactersCount = 0;

  statsWPMEl.innerText = "0";
  statsAccuracyEl.innerText = "100%";
  statsProgressEl.innerText = `0/${currentList.length}`;
}

function recordKeystroke(isCorrect, charLen = 1) {
  if (!sessionStartTime) {
    sessionStartTime = Date.now();
  }
  
  totalKeystrokes++;
  if (isCorrect) {
    correctKeystrokes++;
    typedCharactersCount += charLen;
  }

  // Calculate Accuracy
  const accuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100);
  statsAccuracyEl.innerText = `${accuracy}%`;

  // Calculate WPM
  const timeElapsedMin = (Date.now() - sessionStartTime) / 60000;
  if (timeElapsedMin > 0.01) {
    const wpm = Math.round((typedCharactersCount / 5) / timeElapsedMin);
    statsWPMEl.innerText = Math.max(0, wpm);
  }
}

function resetSession() {
  resetStatsDisplay();
  updateList();
  focusInputField();
}

// ===== RENDER VIRTUAL KEYBOARD LAYOUT =====
function initKeyboard() {
  virtualKeyboardEl.innerHTML = "";
  keyboardRows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";
    row.forEach(keyChar => {
      const keyEl = document.createElement("div");
      keyEl.className = "key";
      keyEl.dataset.key = keyChar;

      // Check special actions
      if (keyChar === "Space") {
        keyEl.classList.add("space-key");
        keyEl.innerText = "Space";
      } else if (keyChar === "Backspace") {
        keyEl.classList.add("action-key");
        keyEl.innerText = "Backspace";
      } else {
        // Show layout details
        if (emulatorEnabled) {
          const qwertyHint = farsiToQwertyKeyMap[keyChar] || "";
          keyEl.innerHTML = `<span class="farsi-letter">${keyChar}</span><span class="qwerty-hint">${qwertyHint.toUpperCase()}</span>`;
        } else {
          keyEl.innerText = keyChar;
        }
      }

      keyEl.addEventListener("click", () => handleInputKey(keyChar));
      rowEl.appendChild(keyEl);
    });
    virtualKeyboardEl.appendChild(rowEl);
  });
}

// ===== LOAD WORD & FEEDBACK SLOTS =====
function loadWord() {
  if (currentList.length === 0) return;
  currentWordObj = currentList[currentWordIndex];
  
  targetWordArabicEl.innerText = sanitizeFarsiText(currentWordObj.word);
  targetWordMeaningEl.innerText = currentWordObj.meaning;
  targetWordTranslitEl.innerText = currentWordObj.translit || "";

  typedText = "";
  completionMessageEl.style.display = "none";
  
  statsProgressEl.innerText = `${completedCount}/${currentList.length}`;

  renderFeedbackSlots();
  highlightNextKey();
  focusInputField();
}

function renderFeedbackSlots() {
  feedbackContainerEl.innerHTML = "";
  const word = sanitizeFarsiText(currentWordObj.word);
  
  for (let i = 0; i < word.length; i++) {
    const slot = document.createElement("div");
    slot.className = "char-box";
    
    if (word[i] === " " || word[i] === "‌") {
      slot.style.borderStyle = "dotted";
      slot.innerHTML = "&nbsp;";
    }
    
    if (i < typedText.length) {
      const typedChar = typedText[i];
      slot.innerText = typedChar === "‌" ? " " : typedChar;
      
      if (typedChar === word[i]) {
        slot.classList.add("correct");
      } else {
        slot.classList.add("incorrect");
        // Shake feedback for mistakes
        slot.classList.add("shake-animation");
        setTimeout(() => slot.classList.remove("shake-animation"), 300);
      }
    } else if (i === typedText.length) {
      slot.classList.add("current");
      if (word[i] === " " || word[i] === "‌") {
        slot.innerHTML = "␣";
      }
    }
    
    feedbackContainerEl.appendChild(slot);
  }
}

// ===== INPUT ENGINE & MATCHING =====
function handleInputKey(key) {
  const targetWord = sanitizeFarsiText(currentWordObj.word);
  
  if (key === "Backspace") {
    if (typedText.length > 0) {
      typedText = typedText.slice(0, -1);
    }
  } else {
    let character = key;
    if (key === "Space") {
      character = " ";
    }

    if (typedText.length < targetWord.length) {
      const targetChar = targetWord[typedText.length];
      const isCorrect = (character === targetChar) || 
                        (targetChar === " " && character === "‌") ||
                        (targetChar === "‌" && character === " "); // accommodate half-spaces

      typedText += character;
      
      // Keystroke statistics
      recordKeystroke(isCorrect, character.length);

      // Trigger standard mobile vibration feedback
      if (isCorrect) {
        if (navigator.vibrate) navigator.vibrate(15);
      } else {
        if (navigator.vibrate) navigator.vibrate([40, 40]);
      }
    }
  }
  
  renderFeedbackSlots();
  highlightNextKey();
  checkWordCompleted();
}

// ===== INTERACTIVE KEY-GUIDE HIGHLIGHTING =====
function highlightNextKey() {
  // Clear previous highlights
  const highlightedKeys = virtualKeyboardEl.querySelectorAll(".key-highlight");
  highlightedKeys.forEach(el => el.classList.remove("key-highlight"));

  const targetWord = sanitizeFarsiText(currentWordObj.word);
  if (typedText.length >= targetWord.length) return; // Word completed

  const nextChar = targetWord[typedText.length];
  let keyToFind = nextChar;

  if (nextChar === " " || nextChar === "‌") {
    keyToFind = "Space";
  }

  // Find the key element on virtual layout
  const keys = virtualKeyboardEl.querySelectorAll(".key");
  for (let keyEl of keys) {
    if (keyEl.dataset.key === keyToFind) {
      keyEl.classList.add("key-highlight");
      break;
    }
  }
}

// ===== SEARCH-TO-PRACTICE ENGINE =====
function handleSearch() {
  const query = dictSearchInput.value.toLowerCase().trim();
  searchSuggestions.innerHTML = "";

  if (!query) {
    searchSuggestions.style.display = "none";
    clearSearchBtn.style.display = "none";
    return;
  }

  clearSearchBtn.style.display = "block";

  // Search across words, phrases, and sentences in database
  let results = [];
  const searchCategories = ["words", "phrases", "sentences"];

  searchCategories.forEach(cat => {
    if (typingDatabase && typingDatabase[cat]) {
      const matches = typingDatabase[cat].filter(item => 
        item.meaning.toLowerCase().includes(query) ||
        item.word.includes(query) ||
        (item.translit && item.translit.toLowerCase().includes(query))
      );
      results = results.concat(matches.map(m => ({ ...m, category: cat })));
    }
  });

  if (results.length === 0) {
    searchSuggestions.innerHTML = `<div class="search-suggestion-item disabled">No matching words or phrases found ❌</div>`;
    searchSuggestions.style.display = "block";
    return;
  }

  // Truncate to top 8 suggestions for performance/layout
  results.slice(0, 8).forEach(item => {
    const itemEl = document.createElement("div");
    itemEl.className = "search-suggestion-item";
    
    // Display Farsi text and its meaning
    itemEl.innerHTML = `
      <span class="suggestion-farsi">${item.word}</span>
      <span class="suggestion-meaning">${item.meaning}</span>
      <span class="suggestion-badge">${item.category.toUpperCase()}</span>
    `;

    itemEl.addEventListener("click", () => {
      // Load this clicked element directly for practice
      currentList = [item];
      currentWordIndex = 0;
      completedCount = 0;
      loadWord();
      resetStatsDisplay();
      
      // Update Category selectors UI
      categorySelector.value = item.category;
      lengthSelector.value = "all";

      clearSearch();
    });

    searchSuggestions.appendChild(itemEl);
  });

  searchSuggestions.style.display = "block";
}

function clearSearch() {
  dictSearchInput.value = "";
  searchSuggestions.style.display = "none";
  clearSearchBtn.style.display = "none";
  focusInputField();
}

// Close suggestion dropdown if click is outside search container
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-practice-container")) {
    searchSuggestions.style.display = "none";
  }
});

// ===== GAME ACTIONS =====
function skipWord() {
  if (currentList.length === 0) return;
  currentWordIndex = (currentWordIndex + 1) % currentList.length;
  loadWord();
}

function checkWordCompleted() {
  const targetWord = sanitizeFarsiText(currentWordObj.word);
  
  if (typedText === targetWord) {
    completionMessageEl.style.display = "block";
    
    if (navigator.vibrate) navigator.vibrate([30, 30, 80]);
    speakTarget();

    completedCount++;
    statsProgressEl.innerText = `${completedCount}/${currentList.length}`;

    // Advance to next word after short delay
    setTimeout(() => {
      currentWordIndex = (currentWordIndex + 1) % currentList.length;
      loadWord();
    }, 1500);
  }
}

function speakTarget() {
  if (!currentWordObj) return;
  const text = sanitizeFarsiText(currentWordObj.word);

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fa-IR";
  const voices = speechSynthesis.getVoices();
  const faVoice = voices.find(v => v.lang.startsWith("fa") || v.lang.startsWith("fa-IR"));
  if (faVoice) {
    utterance.voice = faVoice;
  }
  speechSynthesis.speak(utterance);
}

function focusInputField() {
  keyboardInputEl.focus();
}

// ===== EVENT LISTENERS & DOM LOAD =====
document.addEventListener("DOMContentLoaded", () => {
  // Load data & start practice
  initDatabase();
  initKeyboard();

  // Listen to physical keyboard events via hidden input
  keyboardInputEl.addEventListener("input", (e) => {
    const inputVal = e.target.value;
    e.target.value = ""; // clear immediately
    
    if (inputVal.length > 0) {
      const charTyped = inputVal[inputVal.length - 1];
      
      // If emulator is active and standard character is typed, it's processed onkeydown
      if (!emulatorEnabled) {
        handleInputKey(charTyped);
      }
    }
  });

  // Handle special and layout physical keys
  window.addEventListener("keydown", (e) => {
    // Check if user is currently searching
    if (document.activeElement === dictSearchInput) {
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      handleInputKey("Backspace");
    } else if (e.key === " ") {
      e.preventDefault();
      handleInputKey("Space");
    } else if (emulatorEnabled && e.key.length === 1) {
      // Emulate QWERTY to Farsi matching
      e.preventDefault();
      const mappedChar = qwertyToFarsiMap[e.key];
      if (mappedChar) {
        handleInputKey(mappedChar);
      }
    }
  });
  
  // Ensure keyboard layout remains active on click
  document.addEventListener("click", (e) => {
    // Avoid stealing focus when user clicks standard interactive widgets
    if (e.target.closest("select") || 
        e.target.closest("input") || 
        e.target.closest("button") || 
        e.target.closest(".key") ||
        e.target.closest(".search-suggestion-item")) {
      return;
    }
    focusInputField();
  });
});
