// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

// ===== LOAD STORY =====
fetch("data_farsi.json")
  .then(res => res.json())
  .then(data => {

    const storyKey = localStorage.getItem("currentStory");

    console.log("Dialect:", dialect);
    console.log("StoryKey:", storyKey);
    console.log("Data:", data);

    if (!storyKey) {
      document.getElementById("storyContainer").innerHTML =
        "<p>No story selected ❌</p>";
      return;
    }

    // ✅ STRICT ACCESS (NO ?.)
    if (!data.stories || !data.stories[dialect]) {
      document.getElementById("storyContainer").innerHTML =
        "<p>No stories for this language ❌</p>";
      return;
    }

    const story = data.stories[dialect][storyKey];

    if (!story) {
      document.getElementById("storyContainer").innerHTML =
        "<p>Story not found ❌</p>";
      return;
    }

    // ===== TITLE =====
    document.getElementById("storyTitle").innerText = story.title;

    const container = document.getElementById("storyContainer");
    container.innerHTML = "";

    // ===== DISPLAY WORDS =====
    story.content.forEach(wordObj => {

      const span = document.createElement("span");
      span.className = "word";

      let clean = wordObj.word;

      if (clean.includes("(")) {
        clean = clean.split("(")[0].trim();
      }

      span.innerText = clean;

      span.onclick = function(e) {
        e.stopPropagation();
        showPopup(e, wordObj);
      };

      container.appendChild(span);
    });

  })
  .catch(err => {
    console.error("Error loading story:", err);
  });


// ===== POPUP =====
function showPopup(event, wordObj) {
  const popup = document.getElementById("popup");

  let word = wordObj.word;
  let sound = "";

  if (word.includes("(")) {
    const parts = word.split("(");
    word = parts[0].trim();
    sound = parts[1].replace(")", "").trim();
  }

  popup.innerHTML = `
    <strong>${word}</strong><br>
    <span style="color:#38bdf8;">${sound}</span><br>
    ${wordObj.meaning || ""}
  `;

  popup.style.display = "block";

  const rect = event.target.getBoundingClientRect();

  let left = rect.left + rect.width / 2 - 110;
  let top = rect.top - 70;

  if (left < 10) left = 10;
  if (left + 220 > window.innerWidth) {
    left = window.innerWidth - 230;
  }

  if (top < 10) {
    top = rect.bottom + 10;
  }

  popup.style.left = left + "px";
  popup.style.top = top + "px";
}


// ===== CLOSE POPUP =====
document.addEventListener("click", function(e) {
  if (!e.target.classList.contains("word")) {
    document.getElementById("popup").style.display = "none";
  }
});