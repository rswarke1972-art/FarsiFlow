// ===== GLOBAL =====
let allCharacters = [];
let allWords = [];
let currentQuestion;
let correctAnswer;
let score = 0;

// ===== QUIZ TYPE =====
const quizType = localStorage.getItem("quizType") || "charToSound";

// ===== DIALECT =====
const dialect = localStorage.getItem("selectedDialect") || "farsi";

// ===== LOAD DATA =====
async function loadData() {
  try {
    let res = await fetch("data_farsi.json"); // ✅ FIXED
    let json = await res.json();

    console.log("Loaded:", dialect, json);

    // ===== CHARACTERS =====
    if (json.characters) {
      allCharacters = json.characters.filter(c => c.char);
    }

    // ===== WORDS FROM STORIES =====
    let wordsTemp = [];

    if (json.stories && json.stories[dialect]) {
      Object.values(json.stories[dialect]).forEach(story => {
        story.content.forEach(wordObj => {
          wordsTemp.push(wordObj);
        });
      });
    }

    // remove duplicates
    const unique = new Map();
    wordsTemp.forEach(w => {
      if (!unique.has(w.word)) {
        unique.set(w.word, w);
      }
    });

    allWords = Array.from(unique.values());

    console.log("Words:", allWords.length);

    nextQuestion();

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

// ===== GET RANDOM FORM =====
function getRandomForm(obj) {
  const forms = [
    obj.isolated,
    obj.initial,
    obj.medial,
    obj.final
  ].filter(Boolean);

  return forms.length > 0
    ? forms[Math.floor(Math.random() * forms.length)]
    : obj.char;
}

// ===== GENERATE QUESTION =====
function nextQuestion() {
  document.getElementById("result").innerText = "";
  document.getElementById("nextBtn").style.display = "none";

  let questionDisplay = document.getElementById("questionChar");

  // 🔤 LETTER → SOUND
  if (quizType === "charToSound") {
    currentQuestion = randomFrom(allCharacters);
    questionDisplay.innerText = getRandomForm(currentQuestion);
    correctAnswer = currentQuestion.sound;

  // 🔊 SOUND → LETTER
  } else if (quizType === "soundToChar") {
    currentQuestion = randomFrom(allCharacters);
    questionDisplay.innerText = currentQuestion.sound;
    correctAnswer = getRandomForm(currentQuestion);

  // 📖 WORD → MEANING
  } else if (quizType === "wordToMeaning") {
    currentQuestion = randomFrom(allWords);

    let word = cleanWord(currentQuestion.word);
    questionDisplay.innerText = word;

    correctAnswer = currentQuestion.meaning;

  // 💡 MEANING → WORD
  } else if (quizType === "meaningToWord") {
    currentQuestion = randomFrom(allWords);

    questionDisplay.innerText = currentQuestion.meaning;

    correctAnswer = cleanWord(currentQuestion.word);
  }

  generateOptions();
}

// ===== GENERATE OPTIONS =====
function generateOptions() {
  let options = [correctAnswer];

  while (options.length < 4) {
    let value;

    if (quizType.includes("char")) {
      let rand = randomFrom(allCharacters);

      value = quizType === "charToSound"
        ? rand.sound
        : getRandomForm(rand);

    } else {
      let rand = randomFrom(allWords);

      value = quizType === "wordToMeaning"
        ? rand.meaning
        : cleanWord(rand.word);
    }

    if (value && !options.includes(value)) {
      options.push(value);
    }
  }

  options.sort(() => Math.random() - 0.5);

  let optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  options.forEach(option => {
    let btn = document.createElement("button");
    btn.innerText = option;

    btn.onclick = () => checkAnswer(option);

    optionsDiv.appendChild(btn);
  });
}

// ===== CHECK ANSWER =====
function checkAnswer(selected) {
  let result = document.getElementById("result");

  if (selected === correctAnswer) {
    score++;
    result.innerText = "✅ Correct!";
    result.style.color = "lightgreen";
  } else {
    score--;
    result.innerText = `❌ Wrong! Correct: ${correctAnswer}`;
    result.style.color = "red";
  }

  document.getElementById("score").innerText = "Score: " + score;
  document.getElementById("nextBtn").style.display = "block";

  document.querySelectorAll("#options button").forEach(btn => {
    btn.disabled = true;
  });
}

// ===== HELPERS =====
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cleanWord(word) {
  if (!word) return "";
  return word.includes("(") ? word.split("(")[0].trim() : word;
}

// ===== START =====
loadData();