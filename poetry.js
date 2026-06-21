let poets = [];
let poems = [];
let activeCategory = "all";

const poetsContainer = document.getElementById("poetsContainer");
const poemsContainer = document.getElementById("poemsContainer");
const popupEl = document.getElementById("popup");

// ===== LOAD DATA =====
async function loadPoetryData() {
  try {
    const res = await fetch("poetry_farsi.json");
    const json = await res.json();
    
    poets = json.poets || [];
    poems = json.poems || [];
    
    renderPoets();
    renderPoems();

    // Check for query parameter to open a poet's profile automatically
    const urlParams = new URLSearchParams(window.location.search);
    const poetParam = urlParams.get("poet");
    if (poetParam) {
      const poetObj = poets.find(p => p.id === poetParam);
      if (poetObj) {
        showPoetDetail(poetObj);
      }
    }
  } catch (err) {
    console.error("Error loading poetry data:", err);
  }
}

// ===== RENDER POETS =====
function renderPoets() {
  poetsContainer.innerHTML = "";
  poets.forEach(poet => {
    const card = document.createElement("div");
    card.className = "poet-card";
    card.innerHTML = `
      <div class="poet-avatar">${poet.avatar || "🏛"}</div>
      <div class="poet-name">${poet.name}</div>
    `;
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      showPoetDetail(poet);
    });
    poetsContainer.appendChild(card);
  });
}

// ===== RENDER POEMS =====
function renderPoems() {
  poemsContainer.innerHTML = "";
  
  const filtered = poems.filter(poem => {
    if (activeCategory === "all") return true;
    
    const lvl = poem.level || "";
    const era = poem.era || "";
    
    if (activeCategory === "Beginner") {
      return lvl === "Beginner" || lvl.includes("Beginner");
    }
    if (activeCategory === "Intermediate") {
      return lvl === "Intermediate" || lvl.includes("Intermediate");
    }
    if (activeCategory === "Advanced") {
      return lvl === "Advanced" || lvl.includes("Advanced");
    }
    
    return era.toLowerCase() === activeCategory.toLowerCase();
  });

  if (filtered.length === 0) {
    poemsContainer.innerHTML = "<p>No poems found for this category.</p>";
    return;
  }

  filtered.forEach(poem => {
    const item = document.createElement("div");
    item.className = "poem-list-item";
    
    // Find the poet name
    const poetObj = poets.find(p => p.id === poem.poetId);
    const poetName = poetObj ? poetObj.name.split(" ")[0] : "";

    item.innerHTML = `
      <div class="poem-info">
        <h3>${poem.title}</h3>
        <p>by ${poetName} • <span class="badge">${poem.level}</span> <span class="badge">${poem.era}</span></p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="event.stopPropagation(); readPoem('${poem.id}')" style="width: auto; padding: 6px 12px; margin: 0; font-size: 13px; background: var(--color-success);">▶ Read</button>
        <button onclick="event.stopPropagation(); playPoemGame('${poem.id}')" style="width: auto; padding: 6px 12px; margin: 0; font-size: 13px; background: var(--color-primary);">🧠 Memorize</button>
      </div>
    `;
    
    item.addEventListener("click", () => readPoem(poem.id));
    poemsContainer.appendChild(item);
  });
}

// ===== FILTER CATEGORY =====
window.filterCategory = function(category) {
  activeCategory = category;
  
  // Update active tab styles
  const tabs = document.querySelectorAll(".tab-item");
  tabs.forEach(tab => {
    if (tab.innerText.toLowerCase() === category.toLowerCase() || 
       (category === "all" && tab.innerText.toLowerCase() === "all")) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
  
  renderPoems();
};

// ===== NAVIGATIONS =====
window.readPoem = function(id) {
  window.location.href = `poemViewer.html?id=${id}`;
};

window.playPoemGame = function(id) {
  window.location.href = `poetryGame.html?id=${id}`;
};

// ===== POET DETAIL MODAL =====
function showPoetDetail(poet) {
  popupEl.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 8px;">${poet.avatar || "🏛"}</div>
    <strong>${poet.name}</strong><br><br>
    <p style="text-align: justify; font-size: 13px; color: var(--text-primary); margin-bottom: 12px;">
      ${poet.bio}
    </p>
    <div style="font-size: 12px; text-align: left; color: var(--text-secondary);">
      <strong>Key Themes:</strong> ${poet.themes}<br>
      <strong>Famous Verse:</strong> "${poet.famous_poem}"
    </div>
    <br>
    <button class="action-btn" onclick="closePopup()" style="padding: 8px 16px; font-size: 13px; max-width: 100px; margin: 0 auto; background: var(--bg-accent);">Close</button>
  `;
  popupEl.style.display = "block";
  popupEl.style.position = "fixed";
  popupEl.style.top = "50%";
  popupEl.style.left = "50%";
  popupEl.style.transform = "translate(-50%, -50%)";
  popupEl.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
  popupEl.style.zIndex = "1020";
  popupEl.style.pointerEvents = "auto";
}

window.closePopup = function() {
  popupEl.style.display = "none";
};

// Close popup on click outside
document.addEventListener("click", (e) => {
  if (popupEl.style.display === "block" && !e.target.closest(".poet-card") && !e.target.closest("#popup")) {
    closePopup();
  }
});

// ===== START =====
document.addEventListener("DOMContentLoaded", loadPoetryData);
