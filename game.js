/* ========= SETTINGS ========= */
const TOTAL_IMAGES = 24; // ai 24 imagini: food1..food24

const DIFFICULTIES = {
  easy:   { cols: 4, rows: 4, pairs: 8 },   // 16 cards
  medium: { cols: 6, rows: 4, pairs: 12 },  // 24 cards
  hard:   { cols: 8, rows: 6, pairs: 24 },  // 48 cards (max cu 24 imagini)
};

/* ========= DOM ========= */
const boardEl = document.getElementById("board");
const toastEl = document.getElementById("toast");

const menuOverlay = document.getElementById("menuOverlay");
const modeSingleBtn = document.getElementById("modeSingle");
const modeMultiBtn = document.getElementById("modeMulti");
const difficultyWrap = document.getElementById("difficultyWrap");
const diffBtns = Array.from(document.querySelectorAll(".diffBtn"));
const startBtn = document.getElementById("startBtn");
const howBtn = document.getElementById("howBtn");
const howBox = document.getElementById("howBox");
const soundToggle = document.getElementById("soundToggle");

const menuBtn = document.getElementById("menuBtn");
const newGameBtn = document.getElementById("newGameBtn");

// HUD single
const hudSingle = document.getElementById("hudSingle");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const pairsEl = document.getElementById("pairs");
const totalPairsEl = document.getElementById("totalPairs");

// HUD multi
const hudMulti = document.getElementById("hudMulti");
const p1El = document.getElementById("p1");
const p2El = document.getElementById("p2");
const turnEl = document.getElementById("turn");
const time2El = document.getElementById("time2");
const pairs2El = document.getElementById("pairs2");
const totalPairs2El = document.getElementById("totalPairs2");

/* ========= STATE ========= */
let mode = "single";        // "single" | "multi"
let difficulty = "easy";    // easy|medium|hard
let soundOn = true;

let lockBoard = false;
let firstCard = null;
let secondCard = null;

let seconds = 0;
let timer = null;
let timerRunning = false;

let matchedPairs = 0;
let totalPairs = 0;

// single
let moves = 0;
let score = 0;

// multi
let p1 = 0;
let p2 = 0;
let turn = 1; // 1 or 2

/* ========= SOUNDS (no files, generated) ========= */
function beep(type){
  if (!soundOn) return;
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;

    // simple presets
    let freq = 440, dur = 0.08;
    if (type === "flip") { freq = 520; dur = 0.05; }
    if (type === "match"){ freq = 740; dur = 0.10; }
    if (type === "fail") { freq = 220; dur = 0.10; }
    if (type === "win")  { freq = 880; dur = 0.14; }

    o.frequency.setValueAtTime(freq, now);
    o.type = "sine";

    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    o.start(now);
    o.stop(now + dur + 0.02);

    setTimeout(()=>ctx.close(), 120);
  } catch(e){ /* ignore */ }
}

/* ========= HELPERS ========= */
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
    if (mode === "single") timeEl.textContent = formatTime(seconds);
    else time2El.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer(){
  timerRunning = false;
  if (timer) clearInterval(timer);
  timer = null;
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

function imagesList(pairs){
  // food1.png ... food24.png
  const list = Array.from({ length: TOTAL_IMAGES }, (_, i) => `assets/food${i+1}.png`);
  return shuffle(list).slice(0, pairs);
}

function buildDeck(pairs){
  const picks = imagesList(pairs);
  return shuffle([...picks, ...picks]).map((src, i)=>({ id:i, src }));
}

function setBoardGrid(cols){
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
}

/* ========= UI MODE SWITCH ========= */
function setMode(next){
  mode = next;
  if (mode === "single"){
    hudSingle.classList.remove("hidden");
    hudMulti.classList.add("hidden");
    difficultyWrap.classList.remove("hidden");
    modeSingleBtn.classList.add("active");
    modeMultiBtn.classList.remove("active");
  } else {
    hudSingle.classList.add("hidden");
    hudMulti.classList.remove("hidden");
    difficultyWrap.classList.add("hidden"); // in multi folosim hard by default
    modeMultiBtn.classList.add("active");
    modeSingleBtn.classList.remove("active");
  }
}

function setDifficulty(next){
  difficulty = next;
  diffBtns.forEach(b=>b.classList.toggle("active", b.dataset.diff === next));
}

/* ========= RENDER CARD ========= */
function createCard(data){
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.src = data.src;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Flip card");

  const inner = document.createElement("div");
  inner.className = "inner";

  const front = document.createElement("div");
  front.className = "face front";
  front.innerHTML = `<div class="mark">⭐</div>`;

  const back = document.createElement("div");
  back.className = "face back";
  back.innerHTML = `<img src="${data.src}" class="food-img" draggable="false" alt="food">`;

  inner.append(front, back);
  btn.appendChild(inner);
  card.appendChild(btn);

  btn.addEventListener("click", ()=>flip(card));
  return card;
}

/* ========= GAME LOGIC ========= */
function updateHUD(){
  if (mode === "single"){
    movesEl.textContent = String(moves);
    scoreEl.textContent = String(score);
    pairsEl.textContent = String(matchedPairs);
    totalPairsEl.textContent = String(totalPairs);
    timeEl.textContent = formatTime(seconds);
  } else {
    p1El.textContent = String(p1);
    p2El.textContent = String(p2);
    turnEl.textContent = turn === 1 ? "P1" : "P2";
    pairs2El.textContent = String(matchedPairs);
    totalPairs2El.textContent = String(totalPairs);
    time2El.textContent = formatTime(seconds);
  }
}

function flip(card){
  if (lockBoard) return;
  if (card.classList.contains("flipped")) return;
  if (card.classList.contains("matched")) return;

  startTimer();
  beep("flip");
  card.classList.add("flipped");

  if (!firstCard){
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;

  // moves only in single
  if (mode === "single"){
    moves++;
  }

  const isMatch = firstCard.dataset.src === secondCard.dataset.src;

  if (isMatch){
    beep("match");
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matchedPairs++;

    if (mode === "single"){
      score += 10;
    } else {
      // în multi: cine are tura primește punct și mai joacă o dată
      if (turn === 1) p1++;
      else p2++;
    }

    resetTurn();
    updateHUD();

    if (matchedPairs === totalPairs){
      stopTimer();
      beep("win");
      if (mode === "single"){
        showToast("🎉 Ai terminat!");
      } else {
        const winner = p1 === p2 ? "Egal!" : (p1 > p2 ? "P1 câștigă!" : "P2 câștigă!");
        showToast(`🏁 Game over: ${winner}`);
      }
    }
    return;
  }

  // no match
  beep("fail");

  // în multi: dacă greșește, se schimbă tura după flip-back
  setTimeout(()=>{
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetTurn();

    if (mode === "multi"){
      turn = turn === 1 ? 2 : 1;
    }
    updateHUD();
  }, 650);

  updateHUD();
}

function startGame(){
  stopTimer();
  seconds = 0;
  timerRunning = false;

  lockBoard = false;
  firstCard = null;
  secondCard = null;

  matchedPairs = 0;

  if (mode === "single"){
    const cfg = DIFFICULTIES[difficulty];
    totalPairs = cfg.pairs;
    setBoardGrid(cfg.cols);

    moves = 0;
    score = 0;

    const deck = buildDeck(cfg.pairs);
    boardEl.innerHTML = "";
    deck.forEach(c=>boardEl.appendChild(createCard(c)));

    showToast(`🎮 Single: ${difficulty.toUpperCase()}`);
  } else {
    // Multiplayer: folosim HARD by default (8x6, 24 perechi)
    const cfg = DIFFICULTIES.hard;
    totalPairs = cfg.pairs;
    setBoardGrid(cfg.cols);

    p1 = 0; p2 = 0; turn = 1;

    const deck = buildDeck(cfg.pairs);
    boardEl.innerHTML = "";
    deck.forEach(c=>boardEl.appendChild(createCard(c)));

    showToast("🎮 Multiplayer 2P (ture)");
  }

  updateHUD();
}

/* ========= MENU EVENTS ========= */
modeSingleBtn.addEventListener("click", ()=>setMode("single"));
modeMultiBtn.addEventListener("click", ()=>setMode("multi"));

diffBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    setDifficulty(btn.dataset.diff);
  });
});

soundToggle.addEventListener("change", (e)=>{
  soundOn = !!e.target.checked;
});

howBtn.addEventListener("click", ()=>{
  howBox.classList.toggle("hidden");
});

startBtn.addEventListener("click", ()=>{
  menuOverlay.classList.add("hidden");
  startGame();
});

menuBtn.addEventListener("click", ()=>{
  menuOverlay.classList.remove("hidden");
});

newGameBtn.addEventListener("click", ()=>{
  startGame();
});

/* ========= INIT ========= */
soundOn = true;
setMode("single");
setDifficulty("easy");
updateHUD();
