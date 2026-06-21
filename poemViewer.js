let poem = null;
let currentPlayingVerseIndex = -1;
let speechUtterance = null;
let isPlaying = false;

// DOM selectors
const poemTitle = document.getElementById("poemTitle");
const poemSubtitle = document.getElementById("poemSubtitle");
const poemVersesContainer = document.getElementById("poemVersesContainer");
const playPoemBtn = document.getElementById("playPoemBtn");
const stopPoemBtn = document.getElementById("stopPoemBtn");
const speechSpeed = document.getElementById("speechSpeed");
const speedValue = document.getElementById("speedValue");
const popupEl = document.getElementById("popup");

// ===== LOAD POEM DATA =====
async function loadPoem() {
  const urlParams = new URLSearchParams(window.location.search);
  const poemId = urlParams.get("id");

  if (!poemId) {
    poemTitle.innerText = "No Poem Selected";
    return;
  }

  try {
    const res = await fetch("poetry_farsi.json");
    const json = await res.json();
    
    // Find the poem
    poem = json.poems.find(p => p.id === poemId);
    
    if (!poem) {
      poemTitle.innerText = "Poem Not Found";
      return;
    }
    
    // Find poet details
    const poetObj = json.poets.find(p => p.id === poem.poetId);
    const poetName = poetObj ? poetObj.name : "Unknown Poet";

    poemTitle.innerText = poem.title;
    poemSubtitle.innerText = `by ${poetName} • ${poem.era}`;

    renderVerses();
    initCanvas();
  } catch (err) {
    console.error("Error loading poem:", err);
  }
}

// ===== RENDER VERSES =====
function renderVerses() {
  poemVersesContainer.innerHTML = "";
  
  poem.verses.forEach((verse, verseIdx) => {
    const verseRow = document.createElement("div");
    verseRow.className = "verse-row";
    verseRow.id = `verse-row-${verseIdx}`;
    
    // Build Persian word spans
    const arabicDiv = document.createElement("div");
    arabicDiv.className = "verse-arabic";
    
    const words = verse.farsi.split(" ");
    words.forEach((wordText, wordIdx) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "word";
      wordSpan.id = `word-${verseIdx}-${wordIdx}`;
      wordSpan.innerText = wordText;
      
      // Word click detailed popup dictionary
      wordSpan.addEventListener("click", (e) => {
        e.stopPropagation();
        // Clear all active word highlights first
        document.querySelectorAll(".word").forEach(w => w.classList.remove("active"));
        wordSpan.classList.add("active");
        
        // Find matching word detail in JSON
        const wordClean = cleanWordText(wordText);
        const wordObj = verse.words.find(w => cleanWordText(w.word) === wordClean);
        
        // Find matching phrases in verse.phrases
        const matchingPhrases = [];
        if (verse.phrases) {
          verse.phrases.forEach(p => {
            const phraseWords = p.phrase.split(/\s+/).map(pw => cleanWordText(pw));
            if (phraseWords.includes(wordClean)) {
              matchingPhrases.push(p);
            }
          });
        }
        
        showWordDetail(e, wordText, wordObj, matchingPhrases);
      });
      
      arabicDiv.appendChild(wordSpan);
    });

    // Transliteration
    const translitDiv = document.createElement("div");
    translitDiv.className = "verse-translit";
    translitDiv.innerText = verse.translit;

    // Translation
    const translationDiv = document.createElement("div");
    translationDiv.className = "verse-translation";
    translationDiv.innerText = verse.english;

    verseRow.appendChild(arabicDiv);
    verseRow.appendChild(translitDiv);
    verseRow.appendChild(translationDiv);
    
    poemVersesContainer.appendChild(verseRow);
  });
}

// Helper to remove punctuation, normalize Arabic character variants, and clean word
function cleanWordText(word) {
  if (!word) return "";
  let clean = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،؛«»"']/g, "").trim();
  // Normalize Arabic variants to standard Farsi
  clean = clean.replace(/\u064a/g, "\u06cc"); // Arabic Yeh to Farsi Yeh
  clean = clean.replace(/\u0649/g, "\u06cc"); // Arabic Alif Maksura to Farsi Yeh
  clean = clean.replace(/\u0643/g, "\u06a9"); // Arabic Kaf to Farsi Keheh
  return clean;
}

// ===== SHOW WORD DETAIL POPUP =====
function showWordDetail(event, rawWord, wordObj, matchingPhrases) {
  if (!wordObj) {
    // Basic fallback if word detail is not preconfigured in data
    popupEl.innerHTML = `
      <strong style="font-family: var(--font-arabic); font-size:24px;">${rawWord}</strong><br>
      <span style="color:var(--text-secondary);">Literal dictionary match not found.</span>
    `;
  } else {
    let html = `
      <strong style="font-family: var(--font-arabic); font-size:24px;">${wordObj.word}</strong><br>
      <span style="color: var(--color-primary); font-weight: bold; font-style: italic;">[${wordObj.pron || ""}]</span><br>
      <span style="color: var(--color-success); font-weight: bold;">Meaning: ${wordObj.meaning}</span><br>
      <small style="color: var(--text-secondary); font-size:11px;">Grammar: ${wordObj.grammar || "N/A"}</small><br>
      <p style="font-size:11px; margin-top:8px; border-top:1px solid var(--bg-accent); padding-top:4px; margin-bottom:8px;">
        <strong>Etymology:</strong> ${wordObj.etymology || "N/A"}
      </p>
    `;

    if (matchingPhrases && matchingPhrases.length > 0) {
      matchingPhrases.forEach(p => {
        html += `
          <div class="compound-phrase-box" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--color-primary); text-align: left;">
            <div style="font-size: 11px; color: var(--color-primary); font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Compound Phrase</div>
            <strong style="font-family: var(--font-arabic); font-size: 18px; color: var(--text-primary);">${p.phrase}</strong>
            <span style="color: var(--color-primary); font-size: 11px; font-style: italic;">[${p.pron || ""}]</span><br>
            <span style="color: var(--text-primary); font-weight: 500; font-size: 12px;">Meaning: ${p.meaning}</span>
            ${p.grammar ? `<br><small style="color: var(--text-secondary); font-size:11px;">Grammar: ${p.grammar}</small>` : ''}
          </div>
        `;
      });
    }

    popupEl.innerHTML = html;
  }

  popupEl.style.display = "block";
  popupEl.style.pointerEvents = "auto";

  // Position popup cleanly relative to clicked element
  const rect = event.target.getBoundingClientRect();
  const popupHeight = 150 + (matchingPhrases ? matchingPhrases.length * 80 : 0);
  let left = rect.left + window.scrollX + rect.width / 2 - 125;
  let top = rect.top + window.scrollY - popupHeight;

  if (left < window.scrollX + 10) left = window.scrollX + 10;
  if (left + 250 > window.scrollX + window.innerWidth) {
    left = window.scrollX + window.innerWidth - 260;
  }
  if (rect.top - popupHeight < 10) {
    top = rect.bottom + window.scrollY + 10;
  }

  popupEl.style.left = left + "px";
  popupEl.style.top = top + "px";
}

// Close popup on body click
document.addEventListener("click", () => {
  if (popupEl.style.display === "block") {
    popupEl.style.display = "none";
    document.querySelectorAll(".word").forEach(w => w.classList.remove("active"));
  }
});

// ===== SPEED SLIDER DISPLAY =====
window.updateSpeedDisplay = function() {
  speedValue.innerText = Number(speechSpeed.value).toFixed(1) + "x";
};

// ===== SPEECH PLAYBACK ENGINE =====
window.playFullPoem = function() {
  if (isPlaying) {
    stopPoemSpeech();
    return;
  }
  
  isPlaying = true;
  currentPlayingVerseIndex = 0;
  playPoemBtn.innerText = "⏸ Pause";
  stopPoemBtn.style.display = "inline-flex";
  
  speakVerseChain();
};

window.stopPoemSpeech = function() {
  speechSynthesis.cancel();
  if (typeof responsiveVoice !== 'undefined') responsiveVoice.cancel();
  isPlaying = false;
  currentPlayingVerseIndex = -1;
  playPoemBtn.innerText = "▶ Listen";
  stopPoemBtn.style.display = "none";
  document.querySelectorAll(".word").forEach(w => w.classList.remove("active"));
};

// ===== SPEECH ENGINE =====
// Native speechSynthesis with Farsi voice pack support.

function speakVerseChain() {
  if (!isPlaying || currentPlayingVerseIndex >= poem.verses.length) {
    stopPoemSpeech();
    return;
  }

  const verse = poem.verses[currentPlayingVerseIndex];

  // Highlight current verse row
  document.querySelectorAll(".verse-row").forEach(r => r.style.borderColor = "var(--bg-accent)");
  const activeRow = document.getElementById(`verse-row-${currentPlayingVerseIndex}`);
  if (activeRow) activeRow.style.borderColor = "var(--color-primary)";

  const rate = parseFloat(speechSpeed.value);

  speechUtterance = new SpeechSynthesisUtterance(verse.farsi);
  speechUtterance.lang = "fa-IR";
  speechUtterance.rate = rate;

  const voices = speechSynthesis.getVoices();
  const faVoice = voices.find(v => v.lang.startsWith("fa") || v.lang.startsWith("fa-IR"));
  if (faVoice) speechUtterance.voice = faVoice;

  speechUtterance.onboundary = (event) => {
    if (event.name !== "word") return;
    const textSoFar = verse.farsi.substring(0, event.charIndex);
    const wordCount = textSoFar.split(/\s+/).filter(Boolean).length;
    document.querySelectorAll(`.word[id^="word-${currentPlayingVerseIndex}-"]`).forEach(w => w.classList.remove("active"));
    const targetWordSpan = document.getElementById(`word-${currentPlayingVerseIndex}-${wordCount}`);
    if (targetWordSpan) targetWordSpan.classList.add("active");
  };

  speechUtterance.onend = () => {
    currentPlayingVerseIndex++;
    speakVerseChain();
  };

  speechUtterance.onerror = (e) => {
    console.error("SpeechSynthesis error:", e);
    stopPoemSpeech();
  };

  speechSynthesis.speak(speechUtterance);
}

// ===== CALLIGRAPHY WRITING CANVAS =====
let canvas, ctx;
let drawing = false;
const guidanceWords = ["عشق", "همدم", "سعدی", "مولوی", "وطن", "بهار"];
let currentGuidanceIndex = 0;

function initCanvas() {
  canvas = document.getElementById("tracingCanvas");
  ctx = canvas.getContext("2d");
  
  // Drawing styles
  ctx.strokeStyle = "#22c55e"; // Emerald brush
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Mouse event listeners
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  // Mobile Touch event listeners
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevent standard scroll while tracing!
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    const mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  setGuidanceWord();
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  // Handle viewport zoom / sizing bounds correctly
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDrawing(e) {
  drawing = true;
  const pos = getMousePos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;
  const pos = getMousePos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function stopDrawing() {
  drawing = false;
  ctx.closePath();
}

window.clearCanvas = function() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

window.toggleGuidanceWord = function() {
  currentGuidanceIndex = (currentGuidanceIndex + 1) % guidanceWords.length;
  setGuidanceWord();
  clearCanvas();
};

function setGuidanceWord() {
  const word = guidanceWords[currentGuidanceIndex];
  document.getElementById("canvasGuidance").innerText = word;
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
  loadPoem();
});
