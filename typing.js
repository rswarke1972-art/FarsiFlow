// ===== TYPING PRACTICE DATA =====
const typingWords = [
  { word: "سلام", meaning: "Hello" },
  { word: "دوست", meaning: "Friend" },
  { word: "عشق", meaning: "Love" },
  { word: "مادر", meaning: "Mother" },
  { word: "پدر", meaning: "Father" },
  { word: "کتاب", meaning: "Book" },
  { word: "آب", meaning: "Water" },
  { word: "خوش آمدید", meaning: "Welcome" }
];

let currentWordIndex = 0;
let currentWordObj = typingWords[currentWordIndex];
let typedText = "";

// ===== SELECT DOM ELEMENTS =====
const targetWordArabicEl = document.getElementById("targetWordArabic");
const targetWordMeaningEl = document.getElementById("targetWordMeaning");
const feedbackContainerEl = document.getElementById("feedbackContainer");
const keyboardInputEl = document.getElementById("keyboardInput");
const completionMessageEl = document.getElementById("completionMessage");
const focusInputBtnEl = document.getElementById("focusInputBtn");
const virtualKeyboardEl = document.getElementById("virtualKeyboard");

// ===== RENDER VIRTUAL KEYBOARD LAYOUT =====
const keyboardRows = [
  ["چ", "ج", "ح", "خ", "ه", "ع", "غ", "ف", "ق", "ث", "ص", "ض"],
  ["گ", "ک", "م", "ن", "ت", "ا", "ل", "ب", "ی", "س", "ش", "پ"],
  ["و", "د", "ذ", "ر", "ز", "ژ", "ط", "ظ", "آ", "ء", "ئ"],
  ["Space", "Backspace"]
];

function initKeyboard() {
  virtualKeyboardEl.innerHTML = "";
  keyboardRows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";
    row.forEach(keyChar => {
      const keyEl = document.createElement("div");
      keyEl.className = "key";
      keyEl.innerText = keyChar;
      
      if (keyChar === "Space") {
        keyEl.classList.add("space-key");
      } else if (keyChar === "Backspace") {
        keyEl.classList.add("action-key");
      }

      keyEl.addEventListener("click", () => handleInputKey(keyChar));
      rowEl.appendChild(keyEl);
    });
    virtualKeyboardEl.appendChild(rowEl);
  });
}

// ===== SPEECH SYNTHESIS =====

// Speak Persian text — uses ResponsiveVoice on mobile (no installed voice needed),
// falls back to native Web Speech API on desktop.
function speakTarget() {
  const text = currentWordObj.word;

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

// ===== INITIALIZE LESSON =====
function loadWord() {
  currentWordObj = typingWords[currentWordIndex];
  targetWordArabicEl.innerText = currentWordObj.word;
  targetWordMeaningEl.innerText = "meaning: " + currentWordObj.meaning;
  typedText = "";
  completionMessageEl.style.display = "none";
  renderFeedbackSlots();
  focusInputField();
}

// ===== RENDER SLOTS =====
function renderFeedbackSlots() {
  feedbackContainerEl.innerHTML = "";
  const word = currentWordObj.word;
  
  for (let i = 0; i < word.length; i++) {
    const slot = document.createElement("div");
    slot.className = "char-box";
    
    // Check if space character
    if (word[i] === " ") {
      slot.style.borderStyle = "dotted";
      slot.innerHTML = "&nbsp;";
    }
    
    // Show typed progress
    if (i < typedText.length) {
      const typedChar = typedText[i];
      slot.innerText = typedChar === " " ? " " : typedChar;
      
      if (typedChar === word[i]) {
        slot.classList.add("correct");
      } else {
        slot.classList.add("incorrect");
      }
    } else if (i === typedText.length) {
      slot.classList.add("current");
      if (word[i] === " ") {
        slot.innerHTML = "␣";
      }
    }
    
    feedbackContainerEl.appendChild(slot);
  }
}

// ===== INPUT LOGIC =====
function handleInputKey(key) {
  const targetWord = currentWordObj.word;
  
  if (key === "Backspace") {
    if (typedText.length > 0) {
      typedText = typedText.slice(0, -1);
    }
  } else {
    // Normal key
    let character = key;
    if (key === "Space") {
      character = " ";
    }
    
    if (typedText.length < targetWord.length) {
      typedText += character;
      
      // Trigger haptic vibration on mobile
      if (character === targetWord[typedText.length - 1]) {
        if (navigator.vibrate) navigator.vibrate(15);
      } else {
        if (navigator.vibrate) navigator.vibrate([40, 40]);
      }
    }
  }
  
  renderFeedbackSlots();
  checkWordCompleted();
}

// ===== CHECK COMPLETION =====
function checkWordCompleted() {
  const targetWord = currentWordObj.word;
  
  if (typedText === targetWord) {
    completionMessageEl.style.display = "block";
    if (navigator.vibrate) navigator.vibrate([30, 30, 80]);
    speakTarget();

    // Advance to next word after short delay
    setTimeout(() => {
      currentWordIndex = (currentWordIndex + 1) % typingWords.length;
      loadWord();
    }, 1500);
  }
}

// ===== FOCUS INPUT =====
function focusInputField() {
  keyboardInputEl.focus();
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
  initKeyboard();
  loadWord();

  // Listen to physical keyboard events via hidden input
  keyboardInputEl.addEventListener("input", (e) => {
    const inputVal = e.target.value;
    e.target.value = ""; // clear immediately
    
    if (inputVal.length > 0) {
      const charTyped = inputVal[inputVal.length - 1];
      handleInputKey(charTyped);
    }
  });

  // Handle special physical key like backspace or space
  window.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      handleInputKey("Backspace");
    } else if (e.key === " ") {
      e.preventDefault();
      handleInputKey("Space");
    }
  });
});
