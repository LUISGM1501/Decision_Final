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
let players = [];        // { id, nombre, puntos, posicion, correctas, aceptables, erroneas }
let currentPlayerIndex = 0;
const BOARD_LENGTH = 36; // 0 is start, 35 is just before start. Total 36 squares.
let board = [];          // Array of objects { tipo }
let currentCard = null;
let currentDecision = null; // "A" or "B"
let originPosition = 0;
let usedCards = [];
let gameState = "setup"; // setup | rolling | playing | revealed | finished

/* ═══════════════════════════════════════════
   MODULE: App
   ═══════════════════════════════════════════ */
const App = {
  showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
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
    App.showScreen("config");
  },

  getPlayerColor(id) {
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    return colors[id % colors.length];
  }
};

/* ═══════════════════════════════════════════
   MODULE: Config
   ═══════════════════════════════════════════ */
const Config = {
  _count: 2,

  get count() { return this._count; },

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
   MODULE: Cards
   ═══════════════════════════════════════════ */
const Cards = {
  load(type) {
    let available = DECK.filter((c) => c.tipo === type && !usedCards.includes(c.id));
    
    // Si ya no quedan de esta categoría, reciclamos
    if (available.length === 0) {
      usedCards = usedCards.filter(id => {
        const c = DECK.find(cd => cd.id === id);
        return c && c.tipo !== type;
      });
      available = DECK.filter((c) => c.tipo === type);
    }
    
    if (available.length === 0) return; // Fallback, no debería pasar

    const idx = Math.floor(Math.random() * available.length);
    currentCard = available[idx];
    usedCards.push(currentCard.id);
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
    
    container.innerHTML = `
      <div class="board-center">
         <div class="board-center-logo">Decisión<br>Final</div>
         <div class="board-center-sub">Juego de Mesa</div>
      </div>
    `;
    
    const BOARD_LAYOUT = [
      {r: 10, c: 1}, {r: 9, c: 1}, {r: 8, c: 1}, {r: 7, c: 1}, {r: 6, c: 1}, {r: 5, c: 1}, {r: 4, c: 1}, {r: 3, c: 1}, {r: 2, c: 1}, {r: 1, c: 1},
      {r: 1, c: 2}, {r: 1, c: 3}, {r: 1, c: 4}, {r: 1, c: 5}, {r: 1, c: 6}, {r: 1, c: 7}, {r: 1, c: 8}, {r: 1, c: 9}, {r: 1, c: 10},
      {r: 2, c: 10}, {r: 3, c: 10}, {r: 4, c: 10}, {r: 5, c: 10}, {r: 6, c: 10}, {r: 7, c: 10}, {r: 8, c: 10}, {r: 9, c: 10}, {r: 10, c: 10},
      {r: 10, c: 9}, {r: 10, c: 8}, {r: 10, c: 7}, {r: 10, c: 6}, {r: 10, c: 5}, {r: 10, c: 4}, {r: 10, c: 3}, {r: 10, c: 2}
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
        
        players.forEach(p => {
          if (p.posicion === idx) {
             const token = document.createElement("div");
             token.className = "player-token";
             token.style.background = App.getPlayerColor(p.id);
             token.textContent = p.nombre.charAt(0);
             tokensEl.appendChild(token);
          }
        });
        
        sqEl.appendChild(tokensEl);
        container.appendChild(sqEl);
    });
  },

  startTurn() {
    gameState = "rolling";
    currentDecision = null;
    currentCard = null;
    
    const player = players[currentPlayerIndex];
    document.getElementById("currentPlayerName").textContent = player.nombre;
    document.getElementById("currentPlayerName").style.color = App.getPlayerColor(player.id);
    
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
    document.getElementById("btnNext").style.display = "none";
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
        document.getElementById("diceResultNumber").textContent = Math.floor(Math.random() * 6) + 1;
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
    
    Cards.load(square.tipo);
    
    const card = currentCard;
    const tipoNorm = card.tipo;
    const situationEl = document.getElementById("situationCard");
    situationEl.style.display = "block";
    situationEl.setAttribute("data-tipo", tipoNorm);
    
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
    
    document.getElementById("btnRollDice").style.display = "none";
    document.getElementById("btnReveal").style.display = "inline-flex";
    document.getElementById("btnReveal").disabled = true;
    document.getElementById("btnReveal").onclick = () => Game.revealTurn();
    
    UI.setMessage("Lee la situación y elige tu decisión", "waiting");
  },

  selectDecision(decision) {
    if (gameState !== "playing") return;
    currentDecision = decision;
    
    document.getElementById("btnOptA").className = "choice-btn" + (decision === 'A' ? " selected sel-a" : "");
    document.getElementById("btnOptB").className = "choice-btn" + (decision === 'B' ? " selected sel-b" : "");
    
    document.getElementById("btnReveal").disabled = false;
    UI.setMessage("Decisión tomada. Revela el resultado", "ready");
  },

  revealTurn() {
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
        UI.setMessage("Respuesta incorrecta. Has vuelto a tu casilla anterior.", "revealed", true);
    } else {
        UI.setMessage("¡Buena decisión! Mantienes tu avance.", "revealed");
    }
    
    const resultHTML = this._buildResultHTML(card, pts, isCorrect);
    document.getElementById("resultPanel").innerHTML = resultHTML;
    
    Score.update();
    
    document.getElementById("btnReveal").style.display = "none";
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

  nextTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    this.startTurn();
  },

  endGame(winningPlayer) {
    gameState = "finished";
    
    document.getElementById("btnRollDice").style.display = "none";
    document.getElementById("diceResultView").style.display = "none";
    document.getElementById("situationCard").style.display = "none";
    document.getElementById("resultPanel").innerHTML = "";
    
    UI.setMessage(`¡La partida ha terminado! ¡${winningPlayer.nombre} completó el tablero!`, "ready");

    const sorted = [...players].sort((a, b) => {
      if (a.id === winningPlayer.id) return -1;
      if (b.id === winningPlayer.id) return 1;
      if (b.posicion !== a.posicion) return b.posicion - a.posicion;
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return b.correctas - a.correctas;
    });

    const winner = sorted[0];
    document.getElementById("winnerName").textContent = winner.nombre;
    document.getElementById("winnerScore").textContent = `¡Llegó a la Meta! (${winner.puntos} puntos)`;

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
        </div>`
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
Config.renderInputs();