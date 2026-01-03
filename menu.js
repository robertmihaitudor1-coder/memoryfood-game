(() => {
  const modeSingle = document.getElementById("modeSingle");
  const modeMulti  = document.getElementById("modeMulti");
  const diffBtns   = Array.from(document.querySelectorAll(".diffBtn"));
  const soundToggle = document.getElementById("soundToggle");
  const startLink  = document.getElementById("startLink");
  const howBtn = document.getElementById("howBtn");
  const howBox = document.getElementById("howBox");
  const diffSection = document.getElementById("diffSection");

  let mode = "single";
  let diff = "easy";
  let sound = 1;

  function updateLink(){
    const useDiff = (mode === "single") ? diff : "hard";
    startLink.href = `game.html?mode=${mode}&diff=${useDiff}&sound=${sound}`;
  }

  function setMode(m){
    mode = m;

    modeSingle.classList.toggle("active", mode === "single");
    modeMulti.classList.toggle("active", mode === "multi");

    // Multiplayer = hard by default + ascunde dificultatea
    if (diffSection) diffSection.style.display = (mode === "single") ? "" : "none";
    updateLink();
  }

  function setDiff(d){
    diff = d;
    diffBtns.forEach(b => b.classList.toggle("active", b.dataset.diff === diff));
    updateLink();
  }

  if (modeSingle) modeSingle.addEventListener("click", () => setMode("single"));
  if (modeMulti)  modeMulti.addEventListener("click", () => setMode("multi"));

  diffBtns.forEach(btn => {
    btn.addEventListener("click", () => setDiff(btn.dataset.diff));
  });

  if (soundToggle) {
    soundToggle.addEventListener("change", (e) => {
      sound = e.target.checked ? 1 : 0;
      updateLink();
    });
  }

  if (howBtn && howBox) {
    howBtn.addEventListener("click", () => howBox.classList.toggle("hidden"));
  }

  // init
  setMode("single");
  setDiff("easy");
  updateLink();
})();
