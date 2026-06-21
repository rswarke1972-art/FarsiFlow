// ===== GLOBAL STORAGE =====
let allWords = [];

// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

// ===== LOAD DATA =====
async function loadData() {
  try {
    let res = await fetch("data_farsi.json"); // ✅ FIXED
    let json = await res.json();

    console.log("Search loaded:", dialect, json);

    let temp = [];

    // ===== 1. CHARACTERS =====
    if (json.characters) {
      json.characters.forEach(c => {

        // Character itself
        if (c.char) {
          temp.push({
            word: c.char,
            meaning: c.sound || ""
          });
        }

        // Examples
        if (c.examples) {
          Object.values(c.examples).forEach(ex => {
            if (ex?.word && ex?.meaning) {
              temp.push({
                word: ex.word,
                meaning: ex.meaning
              });
            }
          });
        }
      });
    }

    // ===== 2. STORIES (🔥 IMPORTANT) =====
    if (json.stories && json.stories[dialect]) {
      Object.values(json.stories[dialect]).forEach(story => {
        story.content.forEach(wordObj => {
          if (wordObj.word && wordObj.meaning) {
            temp.push({
              word: wordObj.word,
              meaning: wordObj.meaning
            });
          }
        });
      });
    }

    // ===== 3. REMOVE DUPLICATES =====
    const uniqueMap = new Map();

    temp.forEach(item => {
      let key = item.word + "|" + item.meaning;

      if (item.word && item.meaning && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    allWords = Array.from(uniqueMap.values());

    console.log("Total searchable words:", allWords.length);

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

// ===== CLEAN WORD =====
function clean(word) {
  return word.includes("(") ? word.split("(")[0].trim() : word;
}

// ===== SEARCH FUNCTION =====
function search() {
  let query = document.getElementById("searchInput").value.toLowerCase().trim();
  let resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "";

  if (!query) return;

  // Search by English meaning OR Persian word/transliteration
  let results = allWords.filter(item =>
    item.meaning.toLowerCase().includes(query) ||
    item.word.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No results found ❌</p>";
    return;
  }

  results.forEach(item => {
    let div = document.createElement("div");
    div.className = "result-card";

    let word = clean(item.word);

    // Highlight query in meaning if it matches
    let highlighted = item.meaning;
    try {
      highlighted = item.meaning.replace(
        new RegExp(query, "gi"),
        match => `<mark>${match}</mark>`
      );
    } catch (e) {
      // ignore invalid regex queries
    }

    div.innerHTML = `
      <h2>${word}</h2>
      <p>${highlighted}</p>
    `;

    div.onclick = (e) => {
      e.stopPropagation();
      showPopup(item);
    };

    resultsDiv.appendChild(div);
  });
}

// ===== POPUP =====
function showPopup(item) {
  let popup = document.getElementById("popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "popup";
    document.body.appendChild(popup);
  }

  popup.innerHTML = `
    <strong>${clean(item.word)}</strong><br>
    <span style="color: var(--color-primary); font-weight: bold; font-size: 18px;">
      ${item.meaning}
    </span>
    <br><br>
    <button class="action-btn" onclick="speakSearchWord('${clean(item.word)}')" style="max-width: 120px; padding: 6px 12px; font-size: 13px; margin: 0 auto;">🔊 Speak</button>
  `;
  popup.style.display = "block";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.pointerEvents = "auto";
  popup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
}

// ===== TTS FOR SEARCH =====
window.speakSearchWord = function(word) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "fa-IR";
  const voices = speechSynthesis.getVoices();
  const faVoice = voices.find(v => v.lang.startsWith("fa") || v.lang.startsWith("fa-IR"));
  if (faVoice) {
    utterance.voice = faVoice;
  }
  speechSynthesis.speak(utterance);
};

// Close popup on click outside
document.addEventListener("click", (e) => {
  const popup = document.getElementById("popup");
  if (popup && popup.style.display === "block") {
    if (!e.target.closest(".result-card") && !e.target.closest("#popup")) {
      popup.style.display = "none";
    }
  }
});

// ===== ENTER KEY =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      search();
    }
  });

  loadData();
});

// ===== BACK =====
function goBack() {
  window.history.back();
}