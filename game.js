(() => {
  const TOTAL_IMAGES = 24;

  const DIFFICULTIES = {
    easy:   { cols: 4, pairs: 8 },
    medium: { cols: 6, pairs: 12 },
    hard:   { cols: 8, pairs: 24 },
  };

  const boardEl = document.getElementById("board");
  const toastEl = document.getElementById("toast");
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

  let mode = "single";
  let diff = "easy";
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
  let p1 = 0, p2 = 0, turn = 1;

  function qs(){
    const p = new URLSearchParams(location.search);
    const m = (p.get("mode") || "single").toLowerCase();
    const d = (p.get("diff") || "easy").toLowerCase();
    const s = (p.get("sound") || "1");
    return { mode: m, diff: d, sound: s };
  }

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    setTimeout(()=>toastEl.classList.add("hidden"), 1600);
  }

  function formatTime(s){
    const m = Math.floor(s/60);
    const r = s%60;
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

  function createCard(data){
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.src = data.src;

    const btn = document.createElement("button");
    btn.type = "button";

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

    btn.addEventListener("click", () => flip(card));
    return card;
  }

  function updateHUD(){
    if (mode === "single"){
      hudSingle.classList.remove("hidden");
      hudMulti.classList.add("hidden");
      movesEl.textContent = String(moves);
      scoreEl.textContent = String(score);
      pairsEl.textContent = String(matchedPairs);
      totalPairsEl.textContent = String(totalPairs);
      timeEl.textContent = formatTime(seconds);
    } else {
      hudSingle.classList.add("hidden");
      hudMulti.classList.remove("hidden");
      p1El.textContent = String(p1);
      p2El.textContent = String(p2);
      turnEl.textContent = turn === 1 ? "P1" : "P2";
      pairs2El.textContent = String(matchedPairs);
      totalPairs2El.textContent = String(totalPairs);
      time2El.textContent = formatTime(seconds);
    }
  }

  /* simple generated sounds */
  function beep(type){
    if (!soundOn) return;
    try{
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      const now = ctx.currentTime;

      let freq=440, dur=0.08;
      if (type==="flip")  { freq=520; dur=0.05; }
      if (type==="match") { freq=740; dur=0.10; }
      if (type==="fail")  { freq=220; dur=0.10; }
      if (type==="win")   { freq=880; dur=0.14; }

      o.frequency.setValueAtTime(freq, now);
      o.type="sine";
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
      o.start(now);
      o.stop(now+dur+0.02);
      setTimeout(()=>ctx.close(), 120);
    } catch(e){}
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

    if (mode === "single") moves++;

    const isMatch = firstCard.dataset.src === secondCard.dataset.src;

    if (isMatch){
      beep("match");
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");
      matchedPairs++;

      if (mode === "single") score += 10;
      else {
        if (turn === 1) p1++;
        else p2++;
        // match => aceeași tură
      }

      resetTurn();
      updateHUD();

      if (matchedPairs === totalPairs){
        stopTimer();
        beep("win");
        if (mode === "single") showToast("🎉 Ai terminat!");
        else {
          const winner = p1===p2 ? "Egal!" : (p1>p2 ? "P1 câștigă!" : "P2 câștigă!");
          showToast(`🏁 Game over: ${winner}`);
        }
      }
      return;
    }

    beep("fail");
    setTimeout(()=>{
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();

      if (mode === "multi") turn = (turn===1) ? 2 : 1;
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
    moves = 0;
    score = 0;
    p1 = 0; p2 = 0; turn = 1;

    // multiplayer always hard
    if (mode === "multi") diff = "hard";
    if (!DIFFICULTIES[diff]) diff = "easy";

    const cfg = DIFFICULTIES[diff];
    totalPairs = cfg.pairs;

    setBoardGrid(cfg.cols);

    const deck = buildDeck(cfg.pairs);
    boardEl.innerHTML = "";
    deck.forEach(c => boardEl.appendChild(createCard(c)));

    updateHUD();
    showToast(mode === "single" ? `🎮 Single: ${diff.toUpperCase()}` : "🎮 Multiplayer 2P");
  }

  newGameBtn.addEventListener("click", startGame);

  // INIT
  const params = qs();
  mode = (params.mode === "multi") ? "multi" : "single";
  diff = params.diff;
  soundOn = params.sound !== "0";

  startGame();
})();
