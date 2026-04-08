// ===== GLOBAL VARIABLES =====
let data = [];
let charObj = JSON.parse(localStorage.getItem("character"));

// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

// ===== LOAD DATA =====
fetch(`data_farsi.json`)
  .then(res => res.json())
  .then(json => {
    console.log("Viewer loaded:", dialect, json);

    if (Array.isArray(json)) {
      data = json;
    } else if (json.characters) {
      data = json.characters;
    } else {
      data = [];
    }

    // 🔥 FALLBACK if charObj is missing
    if (!charObj && data.length > 0) {
      charObj = data[0]; // show first character
    }

    loadCharacter(charObj);
  })
  .catch(err => {
    console.error("Failed to load data", err);
  });


// ===== LOAD CHARACTER =====
function loadCharacter(charObj) {
  if (!charObj) {
    console.error("No character data found");
    return;
  }

  const base = charObj.char || "-";

  // 🔤 Character
  document.getElementById("charDisplay").innerText = base;

  // 🔊 Sound
  document.getElementById("infoDisplay").innerText =
    charObj.sound || "";

  // 🧩 Forms (SAFE FIX)
  document.getElementById("isoChar").innerText = charObj.isolated || base;
  document.getElementById("initChar").innerText = charObj.initial || base;
  document.getElementById("medChar").innerText = charObj.medial || base;
  document.getElementById("finChar").innerText = charObj.final || base;

  // 📘 Examples
  setExample("isoExample", charObj.examples?.isolated);
  setExample("initExample", charObj.examples?.initial);
  setExample("medExample", charObj.examples?.medial);
  setExample("finExample", charObj.examples?.final);

  // ✏️ SVG (optional)
  const svg = document.getElementById("character");
  if (svg) {
    svg.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="100">
        ${base}
      </text>
    `;
  }
}


// ===== EXAMPLE =====
function setExample(id, example) {
  const el = document.getElementById(id);

  if (!el) return;

  if (!example || !example.word) {
    el.innerHTML = "-";
    return;
  }

  el.innerHTML = `
    ${example.word}
    <br>
    <small>${example.meaning || ""}</small>
  `;
}


// ===== SOUND =====
function playSound() {
  if (!charObj || !charObj.sound) return;

  const utterance = new SpeechSynthesisUtterance(charObj.sound);
  utterance.lang = "fa-IR";

  speechSynthesis.speak(utterance);
}