/* ═══════════════════════════════════════════
   DECISIÓN FINAL — Game Logic (script.js)

   Modules:
     App     → Navigation, modal, reset, color helpers
     Config  → Player setup, validation
     Game    → Core loop: board, turn, dice, card, reveal
     Score   → Scoreboard rendering
     Cards   → Card selection with category filtering
     UI      → DOM helpers, system messages
   ═══════════════════════════════════════════ */

"use strict";

/* ─── Global State ─── */
let players = []; // { id, nombre, puntos, posicion, correctas, aceptables, erroneas }
let currentPlayerIndex = 0;
const BOARD_LENGTH = 36; // 0 is start, 35 is just before start. Total 36 squares.
let board = []; // Array of objects { tipo }
let currentCard = null;
let currentDecision = null; // "A" or "B"
let originPosition = 0;
let usedCards = [];
let gameState = "setup"; // setup | rolling | playing | revealed | finished
const QUESTION_TIME_LIMIT = 20; // seconds allowed to answer each card

/* ═══════════════════════════════════════════
   MODULE: App
   ═══════════════════════════════════════════ */
const App = {
  showScreen(id) {
    document
      .querySelectorAll(".screen")
      .forEach((s) => s.classList.remove("active"));
    const screen = document.getElementById("screen-" + id);
    if (screen) screen.classList.add("active");
    if (id === "config") Config.renderInputs();
  },

  openCredits() {
    document.getElementById("creditsModal").classList.add("show");
  },

  closeCredits() {
    document.getElementById("creditsModal").classList.remove("show");
  },

  resetGame() {
    players = [];
    currentPlayerIndex = 0;
    usedCards = [];
    currentCard = null;
    currentDecision = null;
    gameState = "setup";
    board = [];
    if (typeof Game !== "undefined" && Game.clearQuestionTimer) {
      Game.clearQuestionTimer();
    }
    UI.hideOverlay();
    App.showScreen("config");
  },

  getPlayerColor(id) {
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
    ];
    return colors[id % colors.length];
  },
};

/* ═══════════════════════════════════════════
   MODULE: Config
   ═══════════════════════════════════════════ */
const Config = {
  _count: 2,

  get count() {
    return this._count;
  },

  increment() {
    if (this._count < 6) {
      this._count++;
      this._sync();
    }
  },

  decrement() {
    if (this._count > 2) {
      this._count--;
      this._sync();
    }
  },

  _sync() {
    document.getElementById("playerCount").value = this._count;
    document.getElementById("playerCountDisplay").textContent = this._count;
    this.renderInputs();
  },

  renderInputs() {
    const container = document.getElementById("playerInputs");
    const n = this._count;
    container.innerHTML = "";
    for (let i = 1; i <= n; i++) {
      const row = document.createElement("div");
      row.className = "player-input-row";
      row.innerHTML = `
        <span class="player-num">${i}</span>
        <input type="text" id="pname${i}" placeholder="Nombre del jugador ${i}" maxlength="20"
               onkeydown="if(event.key==='Enter')Config.startGame()">
      `;
      container.appendChild(row);
    }
    document.getElementById("configError").textContent = "";
  },

  startGame() {
    const n = this._count;
    const names = [];
    const errorEl = document.getElementById("configError");

    for (let i = 1; i <= n; i++) {
      const input = document.getElementById("pname" + i);
      const name = input.value.trim();
      if (!name) {
        errorEl.textContent = `Falta el nombre del jugador ${i}.`;
        input.focus();
        return;
      }
      if (names.includes(name.toLowerCase())) {
        errorEl.textContent = `El nombre "${name}" ya existe. Usá nombres diferentes.`;
        input.focus();
        return;
      }
      names.push(name.toLowerCase());
    }

    const activeDeck = DeckManager.getDeck();
    if (!activeDeck.length) {
      errorEl.textContent = "El mazo está vacío. Agregá al menos una carta.";
      return;
    }
    const missingTypes = DeckManager.missingTypes();
    if (missingTypes.length) {
      errorEl.textContent = `Agregá cartas de tipo: ${missingTypes.join(", ")}.`;
      return;
    }

    players = names.map((name, i) => ({
      id: i,
      nombre: name.charAt(0).toUpperCase() + name.slice(1),
      puntos: 0,
      posicion: 0,
      correctas: 0,
      aceptables: 0,
      erroneas: 0,
    }));

    currentPlayerIndex = 0;
    usedCards = [];

    Game.initBoard();
    App.showScreen("juego");
    Game.startTurn();
  },
};

/* ═══════════════════════════════════════════
   MODULE: DeckManager
   ═══════════════════════════════════════════ */
const DeckManager = {
  baseDeck: JSON.parse(JSON.stringify(DECK)),
  activeDeck: [],
  nextId: 1,
  listEl: null,
  countEl: null,
  statusEl: null,
  form: null,
  errorEl: null,
  panelEl: null,
  toggleBtn: null,
  isPanelCollapsed: true,

  init() {
    this.activeDeck = this.clone(this.baseDeck);
    this.recalculateNextId();
    this.listEl = document.getElementById("deckList");
    this.countEl = document.getElementById("deckCountBadge");
    this.statusEl = document.getElementById("deckStatus");
    this.form = document.getElementById("deckForm");
    this.errorEl = document.getElementById("deckFormError");
    this.panelEl = document.getElementById("deckPanel");
    this.toggleBtn = document.getElementById("deckToggleBtn");
    this.isPanelCollapsed = true;
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute("aria-controls", "deckPanel");
    }

    if (this.form) {
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.addFromForm();
      });
    }

    this.togglePanel(true);
    this.renderList();
  },

  clone(deck) {
    return JSON.parse(JSON.stringify(deck));
  },

  recalculateNextId() {
    const maxId = this.activeDeck.reduce(
      (max, card) => Math.max(max, card.id || 0),
      0,
    );
    this.nextId = maxId + 1;
  },

  getDeck() {
    return this.activeDeck;
  },

  renderList() {
    if (this.countEl) {
      this.countEl.textContent = `${this.activeDeck.length} cartas`;
    }

    if (this.listEl) {
      if (!this.activeDeck.length) {
        this.listEl.innerHTML =
          '<p class="deck-empty">No hay cartas en el mazo. Agregá una nueva pregunta.</p>';
      } else {
        const order = ["oportunidad", "crisis", "innovación", "riesgo"];
        const sorted = [...this.activeDeck].sort((a, b) => {
          const typeDiff = order.indexOf(a.tipo) - order.indexOf(b.tipo);
          return typeDiff !== 0 ? typeDiff : a.id - b.id;
        });
        this.listEl.innerHTML = sorted
          .map((card) => this.buildItem(card))
          .join("");
      }
    }

    if (this.statusEl) {
      if (!this.activeDeck.length) {
        this.statusEl.textContent =
          "⚠️ El mazo está vacío. Agregá al menos una carta.";
        this.statusEl.classList.add("warning");
      } else {
        const missing = this.missingTypes();
        if (missing.length) {
          this.statusEl.textContent = `⚠️ Faltan cartas de tipo: ${missing.join(", ")}.`;
          this.statusEl.classList.add("warning");
        } else {
          this.statusEl.textContent = "Listo para jugar.";
          this.statusEl.classList.remove("warning");
        }
      }
    }
  },

  buildItem(card) {
    const question = this.escape(card.situacion);
    const typeLabel = this.escape(card.tipo);
    return `<div class="deck-item" data-type="${card.tipo}">
        <button type="button" onclick="DeckManager.removeCard(${card.id})" aria-label="Eliminar carta">✕</button>
        <div class="deck-item-type">${typeLabel}</div>
        <p class="deck-item-question">${question}</p>
        <div class="deck-item-options">
          <span>A ${this.formatPts(card.puntosA)} pts</span>
          <span>B ${this.formatPts(card.puntosB)} pts</span>
        </div>
      </div>`.trim();
  },

  formatPts(value) {
    if (Number(value) > 0) return `+${value}`;
    return `${value}`;
  },

  addFromForm() {
    if (!this.form) return;

    const data = {
      tipo: this.form.deckType.value,
      situacion: this.form.deckSituation.value.trim(),
      opcionA: this.form.deckOptionA.value.trim(),
      opcionB: this.form.deckOptionB.value.trim(),
      resultadoA: this.form.deckResultA.value.trim(),
      resultadoB: this.form.deckResultB.value.trim(),
      explicacion: this.form.deckExplanation.value.trim(),
      puntosA: Number(this.form.deckPtsA.value),
      puntosB: Number(this.form.deckPtsB.value),
    };

    const error = this.validate(data);
    if (error) {
      this.setError(error);
      return;
    }

    this.setError("");
    data.id = this.nextId++;
    this.activeDeck.push(data);
    this.form.reset();
    this.form.deckType.value = "oportunidad";
    this.form.deckPtsA.value = "2";
    this.form.deckPtsB.value = "0";
    if (gameState === "setup") {
      usedCards = [];
    }
    this.renderList();
  },

  validate(card) {
    const allowedTypes = ["oportunidad", "crisis", "innovación", "riesgo"];
    if (!allowedTypes.includes(card.tipo)) {
      return "Seleccioná un tipo de carta válido.";
    }

    const requiredFields = [
      { key: "situacion", label: "situación" },
      { key: "opcionA", label: "opción A" },
      { key: "opcionB", label: "opción B" },
      { key: "resultadoA", label: "resultado A" },
      { key: "resultadoB", label: "resultado B" },
      { key: "explicacion", label: "explicación" },
    ];

    const missing = requiredFields.find((field) => !card[field.key]);
    if (missing) {
      return `Completa el campo de ${missing.label}.`;
    }

    if (Number.isNaN(card.puntosA) || card.puntosA < -1 || card.puntosA > 2) {
      return "Los puntos de la opción A deben estar entre -1 y 2.";
    }
    if (Number.isNaN(card.puntosB) || card.puntosB < -1 || card.puntosB > 2) {
      return "Los puntos de la opción B deben estar entre -1 y 2.";
    }

    return "";
  },

  removeCard(id) {
    const numericId = Number(id);
    const index = this.activeDeck.findIndex((card) => card.id === numericId);
    if (index === -1) return;
    this.activeDeck.splice(index, 1);
    if (gameState === "setup") {
      usedCards = [];
    }
    this.renderList();
  },

  reset() {
    this.activeDeck = this.clone(this.baseDeck);
    this.recalculateNextId();
    this.setError("");
    if (gameState === "setup") {
      usedCards = [];
    }
    this.renderList();
  },

  togglePanel(force) {
    if (typeof force === "boolean") {
      this.isPanelCollapsed = force;
    } else {
      this.isPanelCollapsed = !this.isPanelCollapsed;
    }

    if (this.panelEl) {
      this.panelEl.classList.toggle("collapsed", this.isPanelCollapsed);
    }
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute(
        "aria-expanded",
        String(!this.isPanelCollapsed),
      );
      this.toggleBtn.classList.toggle("collapsed", this.isPanelCollapsed);
    }
  },

  missingTypes() {
    const required = ["oportunidad", "crisis", "innovación", "riesgo"];
    return required.filter(
      (type) => !this.activeDeck.some((card) => card.tipo === type),
    );
  },

  setError(message) {
    if (this.errorEl) {
      this.errorEl.textContent = message || "";
    }
  },

  escape(text) {
    if (text === undefined || text === null) return "";
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return String(text).replace(/[&<>"']/g, (char) => map[char] || char);
  },
};

/* ═══════════════════════════════════════════
   MODULE: Cards
   ═══════════════════════════════════════════ */
const Cards = {
  load(type) {
    const deck = DeckManager.getDeck();
    let available = deck.filter(
      (c) => c.tipo === type && !usedCards.includes(c.id),
    );

    if (available.length === 0) {
      usedCards = usedCards.filter((id) => {
        const card = deck.find((cd) => cd.id === id);
        return card && card.tipo !== type;
      });
      available = deck.filter((c) => c.tipo === type);
    }

    if (available.length === 0) {
      currentCard = null;
      return false;
    }

    const idx = Math.floor(Math.random() * available.length);
    currentCard = available[idx];
    usedCards.push(currentCard.id);
    return true;
  },
};

/* ═══════════════════════════════════════════
   MODULE: UI
   ═══════════════════════════════════════════ */
const UI = {
  setMessage(text, state, isBad = false) {
    const msg = document.getElementById("systemMsg");
    const msgText = document.getElementById("systemMsgText");
    msgText.textContent = text;
    msg.className = "system-msg state-" + state;

    if (isBad) {
      msg.style.borderColor = "var(--negative)";
      msg.style.color = "var(--negative)";
      msg.style.backgroundColor = "transparent";
    } else {
      msg.style.borderColor = "";
      msg.style.color = "";
      msg.style.backgroundColor = "";
    }
  },

  formatPts(pts) {
    if (pts > 0) return `<span class="pts-pos">+${pts}</span>`;
    if (pts < 0) return `<span class="pts-neg">${pts}</span>`;
    return `<span class="pts-neu">0</span>`;
  },

  showOverlay() {
    const overlay = document.getElementById("cardOverlay");
    if (!overlay) return;
    overlay.classList.add("show");
    const panel = overlay.querySelector(".overlay-panel");
    if (panel) {
      panel.classList.remove("result-success", "result-fail");
      panel.scrollTop = 0;
    }
    overlay
      .querySelectorAll(".feedback-burst")
      .forEach((node) => node.remove());
  },

  hideOverlay() {
    const overlay = document.getElementById("cardOverlay");
    if (overlay) {
      overlay.classList.remove("show");
      overlay
        .querySelectorAll(".feedback-burst")
        .forEach((node) => node.remove());
      const panel = overlay.querySelector(".overlay-panel");
      if (panel) panel.classList.remove("result-success", "result-fail");
    }
    const card = document.getElementById("situationCard");
    if (card) card.style.display = "none";
    const screen = document.getElementById("screen-juego");
    if (screen) screen.classList.remove("fx-success", "fx-fail");
    const overlayBtn = document.getElementById("overlayRevealBtn");
    if (overlayBtn) {
      overlayBtn.style.display = "none";
      overlayBtn.disabled = true;
    }
  },

  flashFeedback(type) {
    const screen = document.getElementById("screen-juego");
    if (screen) {
      screen.classList.remove("fx-success", "fx-fail");
      void screen.offsetWidth;
      screen.classList.add(type === "success" ? "fx-success" : "fx-fail");
    }

    const overlay = document.getElementById("cardOverlay");
    const panel = overlay ? overlay.querySelector(".overlay-panel") : null;
    if (panel) {
      panel.classList.remove("result-success", "result-fail");
      panel.classList.add(
        type === "success" ? "result-success" : "result-fail",
      );
    }

    this.spawnBurst(type);
  },

  spawnBurst(type) {
    const overlay = document.getElementById("cardOverlay");
    if (!overlay) return;
    for (let i = 0; i < 6; i++) {
      const spark = document.createElement("span");
      spark.className = `feedback-burst ${type}`;
      spark.style.left = `${10 + Math.random() * 80}%`;
      spark.style.setProperty("--tx", `${(Math.random() - 0.5) * 160}px`);
      spark.style.animationDelay = `${i * 0.05}s`;
      overlay.appendChild(spark);
      setTimeout(() => spark.remove(), 1200);
    }
  },
};

/* ═══════════════════════════════════════════
   MODULE: Score
   ═══════════════════════════════════════════ */
const Score = {
  update() {
    const container = document.getElementById("scoreboardContent");

    let html = `<div class="score-row score-header">
      <div>Jugador</div><div>Casilla</div><div>Puntos</div><div>Óptimas</div>
    </div>`;

    const sorted = [...players].sort((a, b) => b.posicion - a.posicion);

    sorted.forEach((p) => {
      html += `<div class="score-row">
        <div class="score-name" style="display:flex; align-items:center;">
          <span class="player-token" style="position:static; display:inline-flex; width:18px; height:18px; font-size:10px; margin-right:8px; background:${App.getPlayerColor(p.id)}">${p.nombre.charAt(0)}</span>
          ${p.nombre}
        </div>
        <div class="score-pts">${p.posicion}</div>
        <div class="score-choice" style="color:var(--text);">${p.puntos}</div>
        <div class="score-optimal">${p.correctas}</div>
      </div>`;
    });

    container.innerHTML = html;
  },
};

/* ═══════════════════════════════════════════
   MODULE: Game
   ═══════════════════════════════════════════ */
const Game = {
  timerId: null,
  timerRemaining: 0,
  initBoard() {
    board = [];
    board.push({ tipo: "inicio" });
    const types = ["oportunidad", "crisis", "innovación", "riesgo"];

    for (let i = 1; i < BOARD_LENGTH; i++) {
      board.push({ tipo: types[Math.floor(Math.random() * types.length)] });
    }
  },

  renderBoard() {
    const container = document.getElementById("boardContainer");
    if (!container) return;
    const activeId = players[currentPlayerIndex]?.id;

    container.innerHTML = `
      <div class="board-center">
         <div class="board-center-logo">Decisión<br>Final</div>
         <div class="board-center-sub">Juego de Mesa</div>
      </div>
    `;

    const BOARD_LAYOUT = [
      { r: 10, c: 1 },
      { r: 9, c: 1 },
      { r: 8, c: 1 },
      { r: 7, c: 1 },
      { r: 6, c: 1 },
      { r: 5, c: 1 },
      { r: 4, c: 1 },
      { r: 3, c: 1 },
      { r: 2, c: 1 },
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 1, c: 3 },
      { r: 1, c: 4 },
      { r: 1, c: 5 },
      { r: 1, c: 6 },
      { r: 1, c: 7 },
      { r: 1, c: 8 },
      { r: 1, c: 9 },
      { r: 1, c: 10 },
      { r: 2, c: 10 },
      { r: 3, c: 10 },
      { r: 4, c: 10 },
      { r: 5, c: 10 },
      { r: 6, c: 10 },
      { r: 7, c: 10 },
      { r: 8, c: 10 },
      { r: 9, c: 10 },
      { r: 10, c: 10 },
      { r: 10, c: 9 },
      { r: 10, c: 8 },
      { r: 10, c: 7 },
      { r: 10, c: 6 },
      { r: 10, c: 5 },
      { r: 10, c: 4 },
      { r: 10, c: 3 },
      { r: 10, c: 2 },
    ];

    board.forEach((square, idx) => {
      const sqEl = document.createElement("div");
      sqEl.className = "board-square";
      sqEl.setAttribute("data-tipo", square.tipo);
      sqEl.innerHTML = `<span>${idx}</span>`;

      if (BOARD_LAYOUT[idx]) {
        sqEl.style.gridRow = BOARD_LAYOUT[idx].r;
        sqEl.style.gridColumn = BOARD_LAYOUT[idx].c;
      }

      // Fichas
      const tokensEl = document.createElement("div");
      tokensEl.className = "tokens-container";

      players.forEach((p) => {
        if (p.posicion === idx) {
          const token = document.createElement("div");
          token.className = "player-token";
          token.style.background = App.getPlayerColor(p.id);
          token.textContent = p.nombre.charAt(0);
          if (p.id === activeId) token.classList.add("is-current");
          tokensEl.appendChild(token);
        }
      });

      sqEl.appendChild(tokensEl);
      container.appendChild(sqEl);
    });
  },

  startQuestionTimer() {
    this.clearQuestionTimer(false);
    this.timerRemaining = QUESTION_TIME_LIMIT;
    const wrapper = document.getElementById("questionTimer");
    if (wrapper) {
      wrapper.style.display = "flex";
      wrapper.classList.remove("danger");
    }
    this.updateTimerDisplay();
    this.timerId = setInterval(() => {
      this.timerRemaining = Math.max(0, this.timerRemaining - 1);
      this.updateTimerDisplay();
      if (this.timerRemaining <= 0) {
        this.handleTimerExpired();
      }
    }, 1000);
  },

  clearQuestionTimer(hide = true) {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (hide) {
      const wrapper = document.getElementById("questionTimer");
      if (wrapper) wrapper.style.display = "none";
    }
  },

  updateTimerDisplay() {
    const wrapper = document.getElementById("questionTimer");
    const valueEl = document.getElementById("questionTimerValue");
    const barEl = document.getElementById("questionTimerProgress");
    if (!wrapper || !valueEl || !barEl) return;
    const remaining = Math.max(0, this.timerRemaining);
    valueEl.textContent = `${remaining}s`;
    const pct = QUESTION_TIME_LIMIT
      ? Math.max(0, (remaining / QUESTION_TIME_LIMIT) * 100)
      : 0;
    barEl.style.width = `${pct}%`;
    wrapper.classList.toggle("danger", remaining <= 5);
  },

  handleTimerExpired() {
    if (gameState !== "playing" || !currentCard) return;
    this.clearQuestionTimer();
    this.timerRemaining = 0;
    gameState = "revealed";
    currentDecision = null;

    const player = players[currentPlayerIndex];
    const penalty = 1;
    player.puntos -= penalty;
    player.erroneas++;
    player.posicion = originPosition;
    this.renderBoard();
    Score.update();

    UI.hideOverlay();
    UI.setMessage(
      "Se acabó el tiempo. Pierdes 1 punto y vuelves a tu casilla anterior.",
      "revealed",
      true,
    );

    const resultPanel = document.getElementById("resultPanel");
    if (resultPanel) {
      resultPanel.innerHTML = this._buildTimeoutHTML(penalty);
    }

    const btnReveal = document.getElementById("btnReveal");
    if (btnReveal) {
      btnReveal.style.display = "none";
      btnReveal.disabled = true;
    }
    const overlayBtn = document.getElementById("overlayRevealBtn");
    if (overlayBtn) {
      overlayBtn.style.display = "none";
      overlayBtn.disabled = true;
    }
    const choicePanel = document.getElementById("singleChoicePanel");
    if (choicePanel) choicePanel.classList.add("locked");
    const btnOptA = document.getElementById("btnOptA");
    const btnOptB = document.getElementById("btnOptB");
    if (btnOptA) btnOptA.disabled = true;
    if (btnOptB) btnOptB.disabled = true;

    const btnNext = document.getElementById("btnNext");
    if (btnNext) {
      btnNext.style.display = "inline-flex";
      btnNext.textContent = "Siguiente Ronda →";
      btnNext.disabled = false;
      btnNext.onclick = () => Game.nextTurn();
    }
    currentCard = null;
  },

  startTurn() {
    gameState = "rolling";
    currentDecision = null;
    currentCard = null;
    this.clearQuestionTimer();
    UI.hideOverlay();

    const player = players[currentPlayerIndex];
    document.getElementById("currentPlayerName").textContent = player.nombre;
    document.getElementById("currentPlayerName").style.color =
      App.getPlayerColor(player.id);

    this.renderBoard();
    Score.update();

    document.getElementById("dicePanel").style.display = "flex";
    document.getElementById("btnRollDice").disabled = false;
    document.getElementById("btnRollDice").style.display = "inline-flex";
    document.getElementById("diceResultView").style.display = "none";

    document.getElementById("situationCard").innerHTML = "";
    document.getElementById("situationCard").style.display = "none";
    document.getElementById("resultPanel").innerHTML = "";

    document.getElementById("btnReveal").style.display = "none";
    const overlayBtn = document.getElementById("overlayRevealBtn");
    if (overlayBtn) {
      overlayBtn.style.display = "none";
      overlayBtn.disabled = true;
    }
    const btnNext = document.getElementById("btnNext");
    btnNext.style.display = "none";
    btnNext.textContent = "Siguiente Ronda →";
    document.getElementById("btnFinish").style.display = "none";

    UI.setMessage("Tirá el dado para avanzar", "waiting");
  },

  rollDice() {
    if (gameState !== "rolling") return;
    document.getElementById("btnRollDice").disabled = true;

    const steps = Math.floor(Math.random() * 6) + 1;

    const diceResultView = document.getElementById("diceResultView");
    diceResultView.style.display = "flex";

    let count = 0;
    const interval = setInterval(() => {
      document.getElementById("diceResultNumber").textContent =
        Math.floor(Math.random() * 6) + 1;
      count++;
      if (count > 10) {
        clearInterval(interval);
        document.getElementById("diceResultNumber").textContent = steps;
        setTimeout(() => Game.movePlayer(steps), 500);
      }
    }, 50);
  },

  movePlayer(steps) {
    const player = players[currentPlayerIndex];
    originPosition = player.posicion;
    player.posicion += steps;

    if (player.posicion >= BOARD_LENGTH) {
      player.posicion = player.posicion % BOARD_LENGTH;
      this.renderBoard();
      this.endGame(player);
      return;
    }

    this.renderBoard();
    this.landOnSquare();
  },

  landOnSquare() {
    gameState = "playing";
    const player = players[currentPlayerIndex];
    const square = board[player.posicion];
    const overlayBtn = document.getElementById("overlayRevealBtn");
    this.clearQuestionTimer();

    const hasCard = Cards.load(square.tipo);
    if (!hasCard || !currentCard) {
      UI.hideOverlay();
      UI.setMessage(
        "No hay cartas disponibles para esta categoría. Ajustá el mazo en Configuración.",
        "ready",
        true,
      );
      document.getElementById("btnRollDice").style.display = "none";
      document.getElementById("btnReveal").style.display = "none";
      if (overlayBtn) {
        overlayBtn.style.display = "none";
        overlayBtn.disabled = true;
      }
      const nextBtn = document.getElementById("btnNext");
      nextBtn.style.display = "inline-flex";
      nextBtn.disabled = false;
      nextBtn.textContent = "Saltar turno";
      nextBtn.onclick = () => Game.nextTurn();
      return;
    }

    const card = currentCard;
    const tipoNorm = card.tipo;
    const situationEl = document.getElementById("situationCard");
    const resultEl = document.getElementById("resultPanel");
    situationEl.style.display = "block";
    situationEl.setAttribute("data-tipo", tipoNorm);
    if (resultEl) resultEl.innerHTML = "";

    situationEl.innerHTML = `
      <span class="badge badge-${tipoNorm}">${card.tipo}</span>
      <p class="situation-text">${card.situacion}</p>
      <div class="options-row">
        <div class="option-box opt-a">
          <div class="opt-label">Opción A</div>
          <p>${card.opcionA}</p>
        </div>
        <div class="option-box opt-b">
          <div class="opt-label">Opción B</div>
          <p>${card.opcionB}</p>
        </div>
      </div>
      <div id="singleChoicePanel" class="single-choice-panel">
         <div class="choice-btns" style="width: 100%;">
           <button id="btnOptA" class="choice-btn" onclick="Game.selectDecision('A')">Opción A</button>
           <button id="btnOptB" class="choice-btn" onclick="Game.selectDecision('B')">Opción B</button>
         </div>
      </div>
    `;
    UI.showOverlay();
    this.startQuestionTimer();

    document.getElementById("btnRollDice").style.display = "none";
    document.getElementById("btnReveal").style.display = "inline-flex";
    document.getElementById("btnReveal").disabled = true;
    document.getElementById("btnReveal").onclick = () => Game.revealTurn();
    if (overlayBtn) {
      overlayBtn.style.display = "inline-flex";
      overlayBtn.disabled = true;
    }

    UI.setMessage("Lee la situación y elige tu decisión", "waiting");
  },

  selectDecision(decision) {
    if (gameState !== "playing") return;
    currentDecision = decision;
    this.clearQuestionTimer();

    document.getElementById("btnOptA").className =
      "choice-btn" + (decision === "A" ? " selected sel-a" : "");
    document.getElementById("btnOptB").className =
      "choice-btn" + (decision === "B" ? " selected sel-b" : "");

    document.getElementById("btnReveal").disabled = false;
    const overlayBtn = document.getElementById("overlayRevealBtn");
    if (overlayBtn) overlayBtn.disabled = false;
    UI.setMessage("Decisión tomada. Revela el resultado", "ready");
  },

  revealTurn() {
    if (gameState !== "playing" || !currentCard || !currentDecision) return;
    this.clearQuestionTimer();
    gameState = "revealed";

    const card = currentCard;
    const player = players[currentPlayerIndex];

    document.getElementById("singleChoicePanel").classList.add("locked");
    document.getElementById("btnOptA").disabled = true;
    document.getElementById("btnOptB").disabled = true;

    const pts = currentDecision === "A" ? card.puntosA : card.puntosB;
    player.puntos += pts;

    let isCorrect = pts > 0;

    if (pts >= 2) player.correctas++;
    else if (pts === 1) player.aceptables++;
    else player.erroneas++;

    if (!isCorrect) {
      player.posicion = originPosition;
      this.renderBoard();
      UI.setMessage(
        "Respuesta incorrecta. Has vuelto a tu casilla anterior.",
        "revealed",
        true,
      );
    } else {
      UI.setMessage("¡Buena decisión! Mantienes tu avance.", "revealed");
    }

    const resultHTML = this._buildResultHTML(card, pts, isCorrect);
    document.getElementById("resultPanel").innerHTML = resultHTML;

    Score.update();
    UI.flashFeedback(isCorrect ? "success" : "fail");
    UI.hideOverlay();

    document.getElementById("btnReveal").style.display = "none";
    const overlayBtn = document.getElementById("overlayRevealBtn");
    if (overlayBtn) {
      overlayBtn.style.display = "none";
      overlayBtn.disabled = true;
    }
    document.getElementById("btnNext").style.display = "inline-flex";
    document.getElementById("btnNext").onclick = () => Game.nextTurn();
  },

  _buildResultHTML(card, pts, isCorrect) {
    const cls = pts >= 2 ? "rp-good" : pts === 1 ? "rp-ok" : "rp-bad";
    const sign = pts > 0 ? "+" : "";
    const player = players[currentPlayerIndex];

    const resultMessage = !isCorrect
      ? `<strong style="color:var(--negative)">Retrocedes a la casilla ${originPosition}</strong>`
      : `<strong style="color:var(--positive)">Mantienes tu posición actual</strong>`;

    return `
      <div class="result-panel">
        <h3>Resultado</h3>
        <div class="result-row">
          <div class="result-box res-a">
            <div class="res-label">Resultado A</div>
            <p>${card.resultadoA}</p>
            <div class="res-pts">${UI.formatPts(card.puntosA)} puntos</div>
          </div>
          <div class="result-box res-b">
            <div class="res-label">Resultado B</div>
            <p>${card.resultadoB}</p>
            <div class="res-pts">${UI.formatPts(card.puntosB)} puntos</div>
          </div>
        </div>
        <div class="result-explanation">
          <strong>¿Por qué?</strong> ${card.explicacion}
        </div>
        <div class="result-players" style="margin-top:1rem; flex-direction:column; gap:0.5rem">
           <div class="result-player-chip ${cls}" style="width:fit-content; border-color:${App.getPlayerColor(player.id)}; background:transparent; padding:0.5rem 1rem;">
             ${player.nombre} eligió ${currentDecision}
             <span class="rp-pts">${sign}${pts} puntos</span>
           </div>
           <div>${resultMessage}</div>
        </div>
      </div>`;
  },

  _buildTimeoutHTML(penalty) {
    const player = players[currentPlayerIndex];
    return `
        <div class="result-panel timeout-result">
          <h3>Tiempo agotado</h3>
          <p>${player.nombre} no respondió a tiempo y vuelve a la casilla ${originPosition}.</p>
          <div class="timeout-chip">
            <span>-${penalty} punto</span>
          </div>
        </div>`;
  },

  nextTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    this.startTurn();
  },

  endGame(winningPlayer) {
    gameState = "finished";
    this.clearQuestionTimer();
    UI.hideOverlay();

    document.getElementById("btnRollDice").style.display = "none";
    document.getElementById("diceResultView").style.display = "none";
    document.getElementById("situationCard").style.display = "none";
    document.getElementById("resultPanel").innerHTML = "";

    UI.setMessage(
      `¡La partida ha terminado! ¡${winningPlayer.nombre} completó el tablero!`,
      "ready",
    );

    const sorted = [...players].sort((a, b) => {
      if (a.id === winningPlayer.id) return -1;
      if (b.id === winningPlayer.id) return 1;
      if (b.posicion !== a.posicion) return b.posicion - a.posicion;
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return b.correctas - a.correctas;
    });

    const winner = sorted[0];
    document.getElementById("winnerName").textContent = winner.nombre;
    document.getElementById("winnerScore").textContent =
      `¡Llegó a la Meta! (${winner.puntos} puntos)`;

    document.getElementById("finalRanking").innerHTML = sorted
      .map((p, i) => {
        const posClass = i < 3 ? `rank-${i + 1}` : "";
        return `
          <div class="rank-row ${posClass}">
            <div class="rank-pos">${i + 1}</div>
            <div class="rank-name">${p.nombre}</div>
            <div class="rank-right">
              <div class="rank-pts">Casilla ${p.posicion}</div>
              <div class="rank-stats">
                Puntos: ${p.puntos} · Óptimas: ${p.correctas}
              </div>
            </div>
          </div>`;
      })
      .join("");

    const awards = this._calculateAwards();
    document.getElementById("finalAwards").innerHTML = awards
      .map(
        (a) => `
        <div class="award-card">
          <div class="award-icon">${a.icon}</div>
          <div class="award-title">${a.title}</div>
          <div class="award-name">${a.name}</div>
        </div>`,
      )
      .join("");

    App.showScreen("final");
  },

  _calculateAwards() {
    const awards = [];

    const maxOptimal = Math.max(...players.map((p) => p.correctas));
    const optimalWinner = players.find((p) => p.correctas === maxOptimal);
    if (optimalWinner && maxOptimal > 0) {
      awards.push({
        icon: "🎯",
        title: "Mejor Estratega",
        name: optimalWinner.nombre,
      });
    }

    const minErrors = Math.min(...players.map((p) => p.erroneas));
    const cautious = players.find((p) => p.erroneas === minErrors);
    if (cautious) {
      awards.push({
        icon: "🛡️",
        title: "Pasos Seguros",
        name: cautious.nombre,
      });
    }

    const maxAcceptable = Math.max(...players.map((p) => p.aceptables));
    const riskTaker = players.find((p) => p.aceptables === maxAcceptable);
    if (riskTaker && maxAcceptable > 0) {
      awards.push({
        icon: "🔥",
        title: "Mayor Riesgo",
        name: riskTaker.nombre,
      });
    }

    return awards;
  },
};

/* ═══════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════ */
DeckManager.init();
Config.renderInputs();
