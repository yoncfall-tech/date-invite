function nextScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function sayYes(answer) {
  document.getElementById("theirAnswer").textContent = answer;
  nextScreen("s-done");
  spawnHearts(30);
}

document.querySelectorAll(".option").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.next;
    const ans = btn.dataset.ans;
    if (next) {
      nextScreen(next);
      if (next === "s-final") {
        const summary = document.getElementById("answersSummary");
        summary.style.display = "block";
        summary.textContent = "Твои ответы записаны: " + ans + " 💫";
      }
    }
  });
});

const noBtn = document.getElementById("noBtn");
if (noBtn) {
  const noWrap = noBtn.closest(".no-wrap");
  const card = document.querySelector(".card");
  const attempts = document.getElementById("noHint");
  noBtn.addEventListener("mouseenter", runAway);
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    runAway();
  });

  function runAway() {
    const cardRect = card.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const maxX = cardRect.width - btnRect.width - 20;
    const maxY = cardRect.height - btnRect.height - 20;
    const x = Math.max(10, Math.random() * maxX);
    const y = Math.max(10, Math.random() * maxY);
    noBtn.style.position = "absolute";
    noBtn.style.left = x + "px";
    noBtn.style.top = y + "px";
    attempts.textContent = "Хм, кнопка убежала... Понял, жду «Да» 😌";
  }
}

function spawnHearts(count) {
  const container = document.querySelector(".hearts");
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.textContent = ["💖", "💕", "💘", "✨"][Math.floor(Math.random() * 4)];
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = 16 + Math.random() * 28 + "px";
    heart.style.animationDuration = 4 + Math.random() * 5 + "s";
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 11000);
  }
}

spawnHearts(14);