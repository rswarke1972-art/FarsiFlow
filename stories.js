// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

// ===== LOAD STORIES =====
fetch("data_farsi.json")
  .then(res => res.json())
  .then(json => {

    const container = document.getElementById("storyList");
    container.innerHTML = "";

    // ✅ get correct dialect
    let stories = json.stories?.[dialect];

    if (!stories || Object.keys(stories).length === 0) {
      container.innerHTML = "<p>No stories available ❌</p>";
      console.error("No stories for:", dialect);
      return;
    }

    // ===== DISPLAY =====
    Object.keys(stories).forEach(key => {
      const story = stories[key];

      const btn = document.createElement("button");
      btn.className = "story-btn";
      btn.innerText = story.title;

      btn.onclick = () => {
        localStorage.setItem("currentStory", key);
        window.location.href = "storyViewer.html";
      };

      container.appendChild(btn);
    });

  })
  .catch(err => {
    console.error("Error loading stories:", err);
  });


// ===== BACK =====
function goBack() {
  window.history.back();
}