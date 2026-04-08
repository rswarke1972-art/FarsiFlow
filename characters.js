// ===== GLOBAL DATA =====
let data = [];

// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

// ===== SAVE SCROLL POSITION =====
window.addEventListener("scroll", () => {
  localStorage.setItem("scrollPosition", window.scrollY);
});

// ===== LOAD DATA =====
fetch(`data_farsi.json`)
  .then(res => res.json())
  .then(json => {
    console.log("Characters loaded:", dialect, json);

    if (Array.isArray(json)) {
      data = json;
    } else if (json.characters) {
      data = json.characters;
    } else {
      data = [];
    }

    loadCharacters();
  })
  .catch(err => {
    console.error("Failed to load data", err);
  });


// ===== LOAD ALL CHARACTERS =====
function loadCharacters() {
  let listDiv = document.getElementById("characterList");
  listDiv.innerHTML = "";

  if (!data || data.length === 0) {
    listDiv.innerHTML = `<p>No characters found</p>`;
    return;
  }

  data.forEach((charObj, index) => {
    let btn = document.createElement("button");
    btn.className = "char-btn";

    btn.innerText = charObj.char || "?";

    btn.onclick = () => {
      // ✅ SEND SAFE OBJECT (IMPORTANT FIX)
      localStorage.setItem("character", JSON.stringify({
        char: charObj.char || "",
        sound: charObj.sound || "",
        isolated: charObj.isolated || "",
        initial: charObj.initial || "",
        medial: charObj.medial || "",
        final: charObj.final || "",
        example: charObj.example || "",
        meaning: charObj.meaning || "",
        examples: charObj.examples || {}
      }));

      localStorage.setItem("lastIndex", index);
      localStorage.setItem("visited_" + charObj.char, "true");

      window.location.href = "viewer.html";
    };

    if (localStorage.getItem("visited_" + charObj.char)) {
      btn.style.background = "#22c55e";
      btn.style.color = "black";
    }

    listDiv.appendChild(btn);
  });

  restoreScrollPosition();
}


// ===== RESTORE SCROLL =====
function restoreScrollPosition() {
  setTimeout(() => {
    const lastIndex = localStorage.getItem("lastIndex");

    if (lastIndex !== null) {
      const buttons = document.querySelectorAll(".char-btn");
      const target = buttons[lastIndex];

      if (target) {
        target.scrollIntoView({
          behavior: "auto",
          block: "center"
        });
        return;
      }
    }

    const scrollPosition = localStorage.getItem("scrollPosition");
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition));
    }
  }, 100);
}


// ===== BACK BUTTON =====
function goBack() {
  window.history.back();
}