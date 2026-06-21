document.addEventListener("DOMContentLoaded", () => {
  // ===== 1. THEME INITIALIZATION =====
  const currentTheme = localStorage.getItem("theme") || "dark";
  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
  }

  // ===== 2. INJECT HEADER =====
  const header = document.createElement("header");
  header.className = "app-header";

  const isLight = document.body.classList.contains("light-theme");
  const themeIcon = isLight ? "🌙" : "☀️";

  // Get current dialect for header display
  const dialect = localStorage.getItem("selectedDialect") || "farsi";
  const dialectNames = {
    farsi: "Farsi (IR)",
    dari: "Dari (AF)",
    pashto: "Pashto"
  };
  const currentDialectName = dialectNames[dialect] || "Farsi";

  header.innerHTML = `
    <a href="index.html" class="logo-container">
      FarsiFlow 🇮🇷
    </a>
    <div class="header-controls">
      <span>${currentDialectName}</span>
      <button id="themeToggleBtn" class="theme-toggle-btn" title="Toggle Light/Dark Mode">${themeIcon}</button>
    </div>
  `;

  // Insert header as the first element of body
  document.body.insertBefore(header, document.body.firstChild);

  // Bind theme toggle event
  const toggleBtn = document.getElementById("themeToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const activeLight = document.body.classList.contains("light-theme");
      localStorage.setItem("theme", activeLight ? "light" : "dark");
      toggleBtn.innerText = activeLight ? "🌙" : "☀️";
    });
  }

  // ===== 3. INJECT BOTTOM NAVIGATION (MOBILE) =====
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";

  const path = window.location.pathname.toLowerCase();

  const tabs = [
    { name: "Home", icon: "🏠", file: "index.html" },
    { name: "Alphabet", icon: "🔤", file: "characters.html", matches: ["character", "viewer.html"] },
    { name: "Stories", icon: "📖", file: "dialect.html", matches: ["dialect", "stories", "storyviewer"] },
    { name: "Typing", icon: "⌨️", file: "typing.html" },
    { name: "Poetry", icon: "🌹", file: "poetry.html", matches: ["poetry", "poemviewer", "poetrygame", "quiz"] }
  ];

  tabs.forEach(tab => {
    const navLink = document.createElement("a");
    navLink.href = tab.file;
    navLink.className = "nav-item";

    // Determine active tab
    let isActive = false;
    if (tab.matches) {
      isActive = tab.matches.some(m => path.includes(m.toLowerCase()));
    } else {
      isActive = path.endsWith(tab.file.toLowerCase()) || 
                 (tab.file === "index.html" && (path === "/" || path === "" || path.endsWith("/index.html") || path.endsWith("/farsiflow/")));
    }

    if (isActive) {
      navLink.classList.add("active");
    }

    navLink.innerHTML = `
      <span class="nav-icon">${tab.icon}</span>
      <span>${tab.name}</span>
    `;

    nav.appendChild(navLink);
  });

  document.body.appendChild(nav);
});
