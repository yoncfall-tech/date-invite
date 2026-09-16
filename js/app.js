const LOG_CONFIG = window.LOG_CONFIG || {};

function sendLog(text) {
  if (!LOG_CONFIG.token || !LOG_CONFIG.chatId) {
    return Promise.reject(new Error("no config"));
  }
  return fetch(`https://api.telegram.org/bot${LOG_CONFIG.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: LOG_CONFIG.chatId,
      text: text,
      disable_web_page_preview: true,
    }),
  }).then((r) => {
    if (!r.ok) throw new Error("telegram error " + r.status);
    return r.json();
  });
}

function nextScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function backToFinal() {
  nextScreen("s-final");
}

/* ---------------- quiz ---------------- */
const quizAnswers = [];
let herFinalAnswer = "";

document.querySelectorAll(".option").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.next;
    const ans = btn.dataset.ans;
    quizAnswers.push(ans);
    if (next) {
      nextScreen(next);
      if (next === "s-final") {
        const summary = document.getElementById("answersSummary");
        summary.style.display = "block";
        summary.textContent = "Твои ответы записаны ✍️ " + quizAnswers.join(" · ");
        sendLog("📋 Она прошла опросик:\n" + quizAnswers.map((a, i) => `  ${i + 1}. ${a}`).join("\n")).catch(() => {});
      }
    }
  });
});

/* ---------------- no button: dodges 5 times, then gives up ---------------- */
const noBtn = document.getElementById("noBtn");
if (noBtn) {
  const noWrap = noBtn.closest(".no-wrap");
  const card = document.querySelector(".card");
  const noHint = document.getElementById("noHint");
  let dodges = 0;
  const MAX_DODGES = 5;

  noBtn.addEventListener("mouseenter", tryDodge);
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (dodges < MAX_DODGES) {
      dodge();
    } else {
      reactSad();
    }
  });

  function tryDodge() {
    if (dodges >= MAX_DODGES) return;
    dodge();
  }

  function dodge() {
    dodges++;
    const wrapRect = noWrap.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const curLeft = parseFloat(noBtn.style.left) || btnRect.left - wrapRect.left;
    const curTop = parseFloat(noBtn.style.top) || btnRect.top - wrapRect.top;
    const radius = 110;
    let dx = 0;
    let dy = 0;
    let tries = 0;
    do {
      dx = (Math.random() * 2 - 1) * radius;
      dy = (Math.random() * 2 - 1) * radius;
      tries++;
    } while (Math.abs(dx) < 50 && Math.abs(dy) < 50 && tries < 12);
    const maxX = Math.max(8, wrapRect.width - btnRect.width - 4);
    const maxY = Math.max(8, wrapRect.height - btnRect.height - 4);
    const x = Math.min(maxX, Math.max(0, curLeft + dx));
    const y = Math.min(maxY, Math.max(0, curTop + dy));
    noBtn.style.position = "absolute";
    noBtn.style.left = x + "px";
    noBtn.style.top = y + "px";
    const left = MAX_DODGES - dodges;
    noHint.textContent =
      left > 0
        ? `Ой! Кнопка убежала (${dodges}/${MAX_DODGES})... Хм, причём тут ${["судьба", "карма", "воля случая", "звёзды", "физика"][dodges - 1]}? 😏`
        : "Ну всё, я сдаюсь. Можешь нажать... но я надеюсь на «Да» 😌";
  }

  function reactSad() {
sendLog(
    "😢 ОНА НАЖАЛА «НЕТ, спасибо»!\nОтветы в опросике:\n" +
      (quizAnswers.map((a, i) => `  ${i + 1}. ${a}`).join("\n") || "  не прошла")
  ).catch(() => {});
    nextScreen("s-sad");
  }
}

/* ---------------- yes ---------------- */
function sayYes(answer) {
  herFinalAnswer = answer;
  sendLog(
    "🥳 ОНА СОГЛАСИЛАСЬ! Ответ: «" + answer + "»\nЧто ей интересно:\n" +
      quizAnswers.map((a, i) => `  ${i + 1}. ${a}`).join("\n")
  ).catch(() => {});
  openCalendar();
}

/* ---------------- calendar ---------------- */
let viewYear, viewMonth;
const selectedDays = [];

function openCalendar() {
  const today = new Date();
  viewYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
  viewMonth = today.getMonth() === 11 ? 0 : today.getMonth() + 1;
  selectedDays.length = 0;
  renderCalendar();
  nextScreen("s-calendar");
  updateCalendarUI();
}

const MONTHS_RU = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

function renderCalendar() {
  const grid = document.getElementById("calGrid");
  grid.innerHTML = "";
  document.getElementById("calTitle").textContent =
    MONTHS_RU[viewMonth] + " " + viewYear;

  const today = new Date();
  const first = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  let firstWeekday = first.getDay();
  if (firstWeekday === 0) firstWeekday = 7;
  const lead = firstWeekday - 1;

  for (let i = 0; i < lead; i++) {
    const pad = document.createElement("div");
    grid.appendChild(pad);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement("button");
    btn.className = "cal-day";
    btn.textContent = d;

    const day = new Date(viewYear, viewMonth, d);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (day < todayStart) {
      btn.classList.add("disabled");
      btn.disabled = true;
    }

    if (day.getTime() === todayStart.getTime()) {
      btn.classList.add("today");
    }

    const iso = toISO(day);
    btn.addEventListener("click", () => toggleDay(iso, btn));
    grid.appendChild(btn);
  }
}

function toISO(day) {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toggleDay(iso, btn) {
  const idx = selectedDays.indexOf(iso);
  if (idx === -1) {
    selectedDays.push(iso);
    btn.classList.add("selected");
  } else {
    selectedDays.splice(idx, 1);
    btn.classList.remove("selected");
  }
  rebuildSelectedText();
  updateCalendarUI();
}

function rebuildSelectedText() {
  const box = document.getElementById("calSelected");
  box.innerHTML = "";
  selectedDays.forEach((iso) => {
    const day = new Date(iso + "T00:00:00");
    const span = document.createElement("span");
    span.textContent = `${day.getDate()} ${MONTHS_RU[day.getMonth()]}`;
    box.appendChild(span);
    box.appendChild(document.createTextNode(", "));
  });
}

function updateCalendarUI() {
  const btn = document.getElementById("confirmDay");
  btn.disabled = selectedDays.length === 0;
  const hint = document.getElementById("calHint");
  hint.textContent =
    selectedDays.length === 0
      ? "Тыкни на удобный день 🙂"
      : selectedDays.map((iso) => {
          const d = new Date(iso + "T00:00:00");
          return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
        }).join(", ");
}

function moveMonth(dir) {
  viewMonth += dir;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
}

document.getElementById("prevMonth").addEventListener("click", () => moveMonth(-1));
document.getElementById("nextMonth").addEventListener("click", () => moveMonth(1));

function formatDays(days, withYear) {
  return days.map((iso) => {
    const d = new Date(iso + "T00:00:00");
    return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}${withYear ? " " + d.getFullYear() : ""}`;
  });
}

document.getElementById("confirmDay").addEventListener("click", () => {
  document.getElementById("confirmDays").textContent = formatDays(selectedDays, true).join(", ");
  document.getElementById("sendStatus").textContent = "";
  nextScreen("s-confirm");
});

document.getElementById("finishBtn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  const status = document.getElementById("sendStatus");
  status.textContent = "Отправляю ответ...";
  const daysTxt = formatDays(selectedDays, true).join(", ");
  sendLog(
    "💘 ОНА ЗАВЕРШИЛА ОПРОС! Выбрала дни:\n  " +
      daysTxt +
      "\nОтвет на главный вопрос: «" + herFinalAnswer + "»\nЧто ей интересно:\n  " +
      (quizAnswers.map((a) => a).join("\n  ") || "—")
  )
    .then(() => {
      status.textContent = "✅ Ответ отправлен";
    })
    .catch(() => {
      status.textContent = "⚠️ Не удалось отправить (проверь интернет/VPN)";
    })
    .finally(() => {
      document.getElementById("doneText").innerHTML =
        "Свидание назначено на:<br><b>" + daysTxt + "</b><br>Я свяжусь с тобой и всё уточним. Жду не дождусь!";
      setTimeout(() => {
        nextScreen("s-done");
        spawnHearts(30);
      }, 700);
    });
});

/* ---------------- hearts ---------------- */
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
sendLog("🎀 Кто-то открыл сайт приглашение! Дальше видно по шагам.").catch(() => {});