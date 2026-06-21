// ===== STATE VARIABLES =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";
let currentStoryData = null;
let currentStoryKey = "";
let currentChapterIndex = 0;
let isRestoringScroll = false;

// ===== LOAD STORY =====
fetch("stories_farsi.json")
  .then(res => res.json())
  .then(data => {
    currentStoryKey = localStorage.getItem("currentStory");

    console.log("Dialect:", dialect);
    console.log("StoryKey:", currentStoryKey);

    if (!currentStoryKey) {
      document.getElementById("storyContainer").innerHTML =
        "<p>No story selected ❌</p>";
      return;
    }

    if (!data.stories || !data.stories[dialect]) {
      document.getElementById("storyContainer").innerHTML =
        "<p>No stories for this language ❌</p>";
      return;
    }

    const story = data.stories[dialect][currentStoryKey];
    currentStoryData = story;

    if (!story) {
      document.getElementById("storyContainer").innerHTML =
        "<p>Story not found ❌</p>";
      return;
    }

    // ===== TITLE =====
    // Parse title to extract the clean Persian name
    let mainTitle = story.title;
    if (mainTitle.includes("(")) {
      mainTitle = mainTitle.split("(")[0].trim();
    }
    document.getElementById("storyTitle").innerText = mainTitle;

    // ===== COMPATIBILITY FALLBACK: FLAT STORIES =====
    if (!story.chapters) {
      document.getElementById("chapterNav").style.display = "none";
      document.getElementById("vocabularySection").style.display = "none";
      document.getElementById("relatedPoetCard").style.display = "none";
      renderFlatStory(story);
      return;
    }

    // ===== INITIALIZE CHAPTERS =====
    document.getElementById("chapterNav").style.display = "flex";
    populateChapterDropdown(story.chapters);

    // Load saved progress if exists
    let savedChapter = 0;
    let shouldRestoreScroll = false;
    const progressSaved = localStorage.getItem("readingProgress_" + currentStoryKey);
    if (progressSaved) {
      try {
        const progress = JSON.parse(progressSaved);
        if (progress.chapter >= 0 && progress.chapter < story.chapters.length) {
          savedChapter = progress.chapter;
          shouldRestoreScroll = true;
        }
      } catch (err) {
        console.error("Error reading saved progress:", err);
      }
    }

    renderChapter(savedChapter, shouldRestoreScroll);
  })
  .catch(err => {
    console.error("Error loading story:", err);
  });

// ===== RENDER FLAT STORY (Dari / Pashto) =====
function renderFlatStory(story) {
  const container = document.getElementById("storyContainer");
  container.innerHTML = "";

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
}

// ===== POPULATE DROPDOWN =====
function populateChapterDropdown(chapters) {
  const select = document.getElementById("chapterSelect");
  select.innerHTML = "";
  chapters.forEach((ch, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.innerText = ch.title;
    select.appendChild(opt);
  });
}

// ===== RENDER CHAPTER CONTENT =====
function renderChapter(index, restoreScroll = false) {
  if (!currentStoryData || !currentStoryData.chapters) return;
  currentChapterIndex = index;
  
  // Set dropdown value
  document.getElementById("chapterSelect").value = index;

  const container = document.getElementById("storyContainer");
  container.innerHTML = "";

  const chapter = currentStoryData.chapters[index];
  if (!chapter) return;

  // Render words
  chapter.content.forEach(wordObj => {
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

  // Render vocabulary
  const vocabSection = document.getElementById("vocabularySection");
  const vocabGrid = document.getElementById("vocabGrid");
  if (chapter.vocabulary && chapter.vocabulary.length > 0) {
    vocabGrid.innerHTML = "";
    chapter.vocabulary.forEach(v => {
      const item = document.createElement("div");
      item.className = "vocab-item";
      item.innerHTML = `
        <div class="vocab-word">${v.word}</div>
        <div class="vocab-translit">${v.translit || ""}</div>
        <div class="vocab-meaning">${v.meaning}</div>
      `;
      vocabGrid.appendChild(item);
    });
    vocabSection.style.display = "block";
  } else {
    vocabSection.style.display = "none";
  }

  // Render related poet
  const relatedCard = document.getElementById("relatedPoetCard");
  if (currentStoryData.relatedPoet) {
    document.getElementById("relatedPoetName").innerText = getPoetDisplayName(currentStoryData.relatedPoet);
    document.getElementById("relatedPoetWork").innerText = currentStoryData.relatedWork || "Related work";
    document.getElementById("relatedPoetLink").href = `poetry.html?poet=${currentStoryData.relatedPoet}`;
    relatedCard.style.display = "flex";
  } else {
    relatedCard.style.display = "none";
  }

  // Update button disabled states
  document.getElementById("prevChapterBtn").disabled = (index === 0);
  document.getElementById("nextChapterBtn").disabled = (index === currentStoryData.chapters.length - 1);

  // Initialize progress bar
  updateProgressBar(0);

  // Restore scroll position if requested
  if (restoreScroll) {
    const saved = localStorage.getItem("readingProgress_" + currentStoryKey);
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        if (progress.chapter === index && progress.scroll > 0) {
          isRestoringScroll = true;
          setTimeout(() => {
            const docHeight = document.documentElement.scrollHeight;
            const winHeight = window.innerHeight;
            const scrollable = docHeight - winHeight;
            if (scrollable > 0) {
              const scrollToY = (progress.scroll / 100) * scrollable;
              window.scrollTo(0, scrollToY);
            }
            isRestoringScroll = false;
            updateProgressBar(progress.scroll);
          }, 150);
        }
      } catch (err) {
        console.error("Error restoring scroll progress:", err);
      }
    }
  } else {
    window.scrollTo(0, 0);
  }
}

// ===== HELPER: POET DISPLAY NAME =====
function getPoetDisplayName(id) {
  const mapping = {
    saadi: "سعدی (Saadi Shirazi)",
    rumi: "مولوی (Rumi)",
    hafez: "حافظ (Hafez)",
    khayyam: "خیام (Omar Khayyam)",
    ferdowsi: "فردوسی (Ferdowsi)",
    attar: "عطار (Attar)",
    nizami: "نظامی (Nizami Ganjavi)",
    forough: "فروغ (Forough Farrokhzad)",
    sohrab: "سهراب (Sohrab Sepehri)",
    parvin: "پروین (Parvin Etesami)"
  };
  return mapping[id] || id;
}

// ===== SAVE PROGRESS =====
function saveProgress(scrollPercent) {
  if (!currentStoryKey || !currentStoryData || !currentStoryData.chapters) return;
  const progressObj = {
    chapter: currentChapterIndex,
    scroll: scrollPercent,
    title: currentStoryData.title,
    level: currentStoryData.level || "Beginner",
    chaptersCount: currentStoryData.chapters.length,
    timestamp: Date.now()
  };
  localStorage.setItem("readingProgress_" + currentStoryKey, JSON.stringify(progressObj));
  localStorage.setItem("lastReadStoryKey", currentStoryKey); // To quick-load in the resume widget
  
  updateProgressBar(scrollPercent);
}

// ===== UPDATE PROGRESS BAR =====
function updateProgressBar(scrollPercent) {
  if (!currentStoryData || !currentStoryData.chapters) return;
  const totalChapters = currentStoryData.chapters.length;
  // Calculate completion percentage: past chapters + current chapter scroll
  const overallPercent = Math.round(((currentChapterIndex + (scrollPercent / 100)) / totalChapters) * 100);
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.style.width = overallPercent + "%";
  }
}

// ===== DEBOUNCED SCROLL LISTENER =====
let scrollTimeout;
window.addEventListener("scroll", () => {
  if (isRestoringScroll || !currentStoryData || !currentStoryData.chapters) return;
  
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const scrollable = docHeight - winHeight;
  
  if (scrollable <= 0) return;
  
  const scrollPercent = Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
  
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    saveProgress(scrollPercent);
  }, 200);
});

// ===== WINDOW NAVIGATION INTERFACES =====
window.prevChapter = function() {
  if (currentChapterIndex > 0) {
    renderChapter(currentChapterIndex - 1);
    saveProgress(0);
  }
};

window.nextChapter = function() {
  if (currentStoryData && currentStoryData.chapters && currentChapterIndex < currentStoryData.chapters.length - 1) {
    renderChapter(currentChapterIndex + 1);
    saveProgress(0);
  }
};

window.onChapterSelectChange = function() {
  const select = document.getElementById("chapterSelect");
  const selectIdx = parseInt(select.value);
  if (!isNaN(selectIdx)) {
    renderChapter(selectIdx);
    saveProgress(0);
  }
};

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

  let left = rect.left + window.scrollX + rect.width / 2 - 110;
  let top = rect.top + window.scrollY - 70;

  if (left < window.scrollX + 10) left = window.scrollX + 10;
  if (left + 220 > window.scrollX + window.innerWidth) {
    left = window.scrollX + window.innerWidth - 230;
  }

  if (rect.top - 70 < 10) {
    top = rect.bottom + window.scrollY + 10;
  }

  popup.style.left = left + "px";
  popup.style.top = top + "px";
}

// ===== CLOSE POPUP =====
document.addEventListener("click", function(e) {
  if (!e.target.classList.contains("word")) {
    const popup = document.getElementById("popup");
    if (popup) popup.style.display = "none";
  }
});