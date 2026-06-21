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
    initFormSelection();
    initCanvas();
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

// Speak Persian text — uses ResponsiveVoice on mobile (no installed voice needed),
// falls back to native Web Speech API on desktop.
function playSound() {
  if (!charObj) return;
  const textToSpeak = charObj.char || charObj.isolated;
  if (!textToSpeak) return;

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = "fa-IR";
  const voices = speechSynthesis.getVoices();
  const faVoice = voices.find(v => v.lang.startsWith("fa") || v.lang.startsWith("fa-IR"));
  if (faVoice) {
    utterance.voice = faVoice;
  }
  speechSynthesis.speak(utterance);
}

// ===== FORM SELECTIONS & CANVAS COUPLING =====
let activeForm = 'isolated'; // default selected form

function initFormSelection() {
  const formCards = {
    'isolated': { container: document.getElementById("isoCardContainer"), charEl: document.getElementById("isoChar") },
    'initial': { container: document.getElementById("initCardContainer"), charEl: document.getElementById("initChar") },
    'medial': { container: document.getElementById("medCardContainer"), charEl: document.getElementById("medChar") },
    'final': { container: document.getElementById("finCardContainer"), charEl: document.getElementById("finChar") }
  };

  Object.keys(formCards).forEach(formKey => {
    const card = formCards[formKey];
    if (card.container) {
      card.container.addEventListener("click", () => {
        // Highlight active form card
        Object.values(formCards).forEach(c => {
          if (c.container) c.container.classList.remove("active");
        });
        card.container.classList.add("active");
        
        // Update activeForm and the canvas guidance overlay character
        activeForm = formKey;
        const charValue = card.charEl ? card.charEl.innerText : (charObj.char || "");
        setCanvasGuidance(charValue);
        clearCanvas();
      });
    }
  });

  // Set default active card
  if (formCards['isolated'].container) {
    formCards['isolated'].container.classList.add("active");
    const defaultChar = formCards['isolated'].charEl ? formCards['isolated'].charEl.innerText : (charObj.char || "");
    setCanvasGuidance(defaultChar);
  }
}

function setCanvasGuidance(char) {
  document.getElementById("canvasGuidance").innerText = char;
}

// ===== CALLIGRAPHY WRITING CANVAS =====
let canvas, ctx;
let drawing = false;

function initCanvas() {
  canvas = document.getElementById("tracingCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  
  // Drawing styles
  ctx.strokeStyle = "#22c55e"; // Emerald brush
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Mouse event listeners
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  // Mobile Touch event listeners
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevent standard scroll while tracing!
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    const mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDrawing(e) {
  drawing = true;
  const pos = getMousePos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;
  const pos = getMousePos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function stopDrawing() {
  drawing = false;
  ctx.closePath();
}

window.clearCanvas = function() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

window.resetCanvasState = function() {
  clearCanvas();
  // Simply flash/pulse active form guidance
  const guidance = document.getElementById("canvasGuidance");
  if (guidance) {
    guidance.style.transition = "opacity 0.15s ease";
    guidance.style.opacity = "0.4";
    setTimeout(() => {
      guidance.style.opacity = "0.15";
    }, 150);
  }
};