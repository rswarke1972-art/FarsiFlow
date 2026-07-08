// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

const dialectNames = {
  farsi: "🇮🇷 Farsi (Iran)",
  dari: "🇦🇫 Dari (Afghanistan)",
  pashto: "🇦🇫 Pashto"
};

document.addEventListener("DOMContentLoaded", () => {
  const currentDialectEl = document.getElementById("currentDialect");
  if (currentDialectEl) {
    currentDialectEl.innerText = "Selected Language: " + (dialectNames[dialect] || "Farsi");
  }
});


// ===== LOAD STORIES =====
Promise.all([
  fetch("stories_farsi_part1.json").then(res => res.json()),
  fetch("stories_farsi_part2.json").then(res => res.json())
])
  .then(([part1, part2]) => {
    // Merge both parts
    const json = {
      stories: {
        farsi: {
          ...part1.stories.farsi,
          ...part2.stories.farsi
        }
      }
    };

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

      // Parse title and subtitle
      let title = story.title;
      let subtitle = "";
      if (title.includes("(")) {
        const parts = title.split("(");
        title = parts[0].trim();
        subtitle = parts[1].replace(")", "").trim();
      }

      // Calculate stats
      const chaptersCount = story.chapters ? story.chapters.length : 1;
      let wordsCount = story.wordsCount || 0;
      if (!wordsCount) {
        if (story.chapters) {
          story.chapters.forEach(ch => {
            wordsCount += ch.content ? ch.content.length : 0;
          });
        } else if (story.content) {
          wordsCount = story.content.length;
        }
      }
      
      const readingTime = Math.ceil(wordsCount / 100); // ~100 words per minute for learners
      const difficulty = story.level || "Beginner";
      const difficultyClass = difficulty.toLowerCase().replace(" ", "-");

      // Create card
      const card = document.createElement("div");
      card.className = "story-card";
      
      card.innerHTML = `
        <div class="story-card-header">
          <h3 class="story-card-title">${title}</h3>
          <span class="difficulty-badge ${difficultyClass}">${difficulty}</span>
        </div>
        <div class="story-card-subtitle">${subtitle || "Persian Story"}</div>
        <div class="story-card-stats">
          <span>📚 ${chaptersCount} ${chaptersCount === 1 ? 'Chapter' : 'Chapters'}</span>
          <span>📝 ${wordsCount.toLocaleString()} Words</span>
          <span>⏱️ ${readingTime} min read</span>
        </div>
        <button class="read-story-btn">Read Story →</button>
      `;

      card.onclick = () => {
        localStorage.setItem("currentStory", key);
        window.location.href = "storyViewer.html";
      };

      container.appendChild(card);
    });

  })
  .catch(err => {
    console.error("Error loading stories:", err);
  });


// ===== BACK =====
function goBack() {
  window.history.back();
}