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

  let results = allWords.filter(item =>
    item.meaning.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    resultsDiv.innerHTML = "<p>No results found ❌</p>";
    return;
  }

  results.forEach(item => {
    let div = document.createElement("div");
    div.className = "result-card";

    let word = clean(item.word);

    let highlighted = item.meaning.replace(
      new RegExp(query, "gi"),
      match => `<mark>${match}</mark>`
    );

    div.innerHTML = `
      <h2>${word}</h2>
      <p>${highlighted}</p>
    `;

    // 🔥 IMPROVED POPUP
    div.onclick = () => {
      showPopup(item);
    };

    resultsDiv.appendChild(div);
  });
}

// ===== POPUP =====
function showPopup(item) {
  alert(`${clean(item.word)}\n\n${item.meaning}`);
}

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