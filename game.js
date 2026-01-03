const COLS = 8;     
const PAIRS = 24;  

// imagini: food1.png → food24.png
const IMAGES = Array.from({ length: PAIRS }, (_, i) => {
  return `assets/food${i + 1}.png`;
});

const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const timeEl  = document.getElementById("time");
const scoreEl = document.getElementById("score");
const pairsEl = document.getElementById("pairs");
const totalPairsEl = document.getElementById("totalPairs");
const newGameBtn = document.getElementById("newGameBtn");
const toastEl = document.getElementById("toast");

let moves = 0;
let score = 0;
let matchedPairs = 0;

let firstCard = null;
let secondCard = null;
let lockBoard = false;

let timer = null;
let seconds = 0;
let timerRunning = false;

totalPairsEl.textContent = String(PAIRS);
boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  setTimeout(()=>toastEl.classList.add("hidden"), 1400);
}

function formatTime(s){
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,"0")}`;
}

function startTimer(){
  if (timerRunning) return;
  timerRunning = true;
  timer = setInterval(()=>{
    seconds++;
    timeEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer(){
  timerRunning = false;
  if (timer) clearInterval(timer);
}

function resetTurn(){
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(){
  return shuffle([...IMAGES, ...IMAGES]).map((src, i)=>({ id:i, src }));
}

function updateHUD(){
  movesEl.textContent = moves;
  scoreEl.textContent = score;
  pairsEl.textContent = matchedPairs;
  timeEl.textContent = formatTime(seconds);
}

function createCard(data){
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.src = data.src;

  const btn = document.createElement("button");
  const inner = document.createElement("div");
  inner.className = "inner";

  const front = document.createElement("div");
  front.className = "face front";
  front.innerHTML = `<div class="mark">⭐</div>`;

  const back = document.createElement("div");
  back.className = "face back";
  back.innerHTML = `<img src="${data.src}" class="food-img" draggable="false">`;

  inner.append(front, back);
  btn.appendChild(inner);
  card.appendChild(btn);

  btn.addEventListener("click", ()=>flip(card));
  return card;
}

function flip(card){
  if (lockBoard || card.classList.contains("flipped")) return;

  startTimer();
  card.classList.add("flipped");

  if (!firstCard){
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves++;

  if (firstCard.dataset.src === secondCard.dataset.src){
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matchedPairs++;
    score += 10;
    resetTurn();

    if (matchedPairs === PAIRS){
      stopTimer();
      showToast("🎉 Nivel complet!");
    }
  } else {
    setTimeout(()=>{
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 650);
  }

  updateHUD();
}

function newGame(){
  stopTimer();
  seconds = 0;
  moves = 0;
  score = 0;
  matchedPairs = 0;
  resetTurn();

  boardEl.innerHTML = "";
  buildDeck().forEach(c => boardEl.appendChild(createCard(c)));

  updateHUD();
  showToast("🎮 Joc nou!");
}

newGameBtn.addEventListener("click", newGame);
newGame();
