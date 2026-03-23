/* ═══════════════════════════════════════════
   DECISIÓN FINAL — Game Logic (script.js)

   Modules:
     App     → Navigation, modal, reset
     Config  → Player setup, validation
     Game    → Core loop: load, select, reveal, next, end
     Score   → Scoreboard rendering
     Cards   → Card selection with type balancing
     UI      → DOM helpers, system messages
   ═══════════════════════════════════════════ */

   "use strict";

   /* ─── Global State (Sección 5 spec) ─── */
   let players = [];        // { id, nombre, puntos, decisionActual, correctas, aceptables, erroneas }
   let currentRound = 1;
   const MAX_ROUNDS = 10;
   let currentCard = null;
   let usedCards = [];
   let gameState = "setup"; // setup | playing | revealed | finished
   let lastCrisisWinners = []; // ids — desempate regla 10
   
   /* ═══════════════════════════════════════════
      MODULE: App — Screen navigation & global
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
       currentRound = 1;
       usedCards = [];
       currentCard = null;
       lastCrisisWinners = [];
       gameState = "setup";
       App.showScreen("config");
     },
   };
   
   /* ═══════════════════════════════════════════
      MODULE: Config — Player setup
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
   
     /* RF-01: Registrar 2-6 jugadores con validaciones (Sección 14) */
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
   
       /* RF-02: Iniciar con puntajes en 0 */
       players = names.map((name, i) => ({
         id: i,
         nombre: name.charAt(0).toUpperCase() + name.slice(1),
         puntos: 0,
         decisionActual: null,
         correctas: 0,
         aceptables: 0,
         erroneas: 0,
       }));
   
       currentRound = 1;
       usedCards = [];
       lastCrisisWinners = [];
       gameState = "playing";
   
       Cards.load();
       App.showScreen("juego");
       Game.renderRound();
     },
   };
   
   /* ═══════════════════════════════════════════
      MODULE: Cards — Selection with type balance
      ═══════════════════════════════════════════ */
   const Cards = {
   
     /**
      * Carga una carta no usada, intentando balancear tipos (Sección 9).
      * Distribución deseada: ~2-3 de cada tipo por partida de 10 rondas.
      */
     load() {
       const available = DECK.filter((c) => !usedCards.includes(c.id));
       if (available.length === 0) return;
   
       // Contar tipos ya usados
       const usedTypes = {};
       usedCards.forEach((id) => {
         const card = DECK.find((c) => c.id === id);
         if (card) usedTypes[card.tipo] = (usedTypes[card.tipo] || 0) + 1;
       });
   
       // Priorizar tipos menos usados
       const minUsed = Math.min(
         usedTypes["oportunidad"] || 0,
         usedTypes["crisis"] || 0,
         usedTypes["innovación"] || 0,
         usedTypes["riesgo"] || 0
       );
   
       const prioritized = available.filter((c) => (usedTypes[c.tipo] || 0) === minUsed);
       const pool = prioritized.length > 0 ? prioritized : available;
   
       const idx = Math.floor(Math.random() * pool.length);
       currentCard = pool[idx];
       usedCards.push(currentCard.id);
   
       // Limpiar decisiones
       players.forEach((p) => (p.decisionActual = null));
     },
   };
   
   /* ═══════════════════════════════════════════
      MODULE: UI — DOM helpers & system messages
      ═══════════════════════════════════════════ */
   const UI = {
   
     /* Sección 13: Mensajes del sistema */
     setMessage(text, state) {
       const msg = document.getElementById("systemMsg");
       const msgText = document.getElementById("systemMsgText");
       msgText.textContent = text;
       msg.className = "system-msg state-" + state; // waiting | ready | revealed
     },
   
     formatPts(pts) {
       if (pts > 0) return `<span class="pts-pos">+${pts}</span>`;
       if (pts < 0) return `<span class="pts-neg">${pts}</span>`;
       return `<span class="pts-neu">0</span>`;
     },
   
     renderProgressBar() {
       const pct = (currentRound / MAX_ROUNDS) * 100;
       document.getElementById("progressBar").style.width = pct + "%";
   
       // Dots
       const dots = document.getElementById("progressDots");
       dots.innerHTML = "";
       for (let i = 1; i < MAX_ROUNDS; i++) {
         const dot = document.createElement("div");
         dot.className = "progress-dot";
         dots.appendChild(dot);
       }
     },
   };
   
   /* ═══════════════════════════════════════════
      MODULE: Score — Scoreboard rendering
      ═══════════════════════════════════════════ */
   const Score = {
   
     /* RF-07: Actualizar marcador tras cada ronda */
     update() {
       const container = document.getElementById("scoreboardContent");
   
       // Header
       let html = `<div class="score-row score-header">
         <div>Jugador</div><div>Puntos</div><div>Elección</div><div>Óptimas</div>
       </div>`;
   
       // Sort by points for display
       const sorted = [...players].sort((a, b) => b.puntos - a.puntos);
   
       sorted.forEach((p) => {
         const choiceClass = p.decisionActual === "A" ? "sc-a" : p.decisionActual === "B" ? "sc-b" : "sc-none";
         const choiceText = p.decisionActual || "—";
         html += `<div class="score-row">
           <div class="score-name">${p.nombre}</div>
           <div class="score-pts">${p.puntos}</div>
           <div class="score-choice ${choiceClass}">${choiceText}</div>
           <div class="score-optimal">${p.correctas}</div>
         </div>`;
       });
   
       container.innerHTML = html;
     },
   };
   
   /* ═══════════════════════════════════════════
      MODULE: Game — Core game loop
      ═══════════════════════════════════════════ */
   const Game = {
   
     /* Renderizar la ronda completa */
     renderRound() {
       document.getElementById("roundCurrent").textContent = currentRound;
       UI.renderProgressBar();
   
       // Situation card (RF-03)
       const card = currentCard;
       const tipoNorm = card.tipo; // "innovación" matches CSS badge-innovación
       const situationEl = document.getElementById("situationCard");
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
       `;
   
       // IMPORTANT: set state BEFORE rendering players,
       // otherwise renderPlayers() sees "revealed" and locks buttons
       gameState = "playing";
   
       this.renderPlayers();
       Score.update();
   
       // Reset UI state
       document.getElementById("resultPanel").innerHTML = "";
       document.getElementById("btnReveal").disabled = true;
       document.getElementById("btnReveal").style.display = "";
       document.getElementById("btnNext").style.display = "none";
       document.getElementById("btnFinish").style.display = "none";
   
       UI.setMessage("Todos los jugadores deben elegir su opción", "waiting");
     },
   
     /* Renderizar paneles de jugadores */
     renderPlayers() {
       const grid = document.getElementById("playersGrid");
       const locked = gameState === "revealed";
   
       grid.innerHTML = players
         .map((p) => {
           const selA = p.decisionActual === "A" ? "selected sel-a" : "";
           const selB = p.decisionActual === "B" ? "selected sel-b" : "";
           const decided = p.decisionActual ? "decided" : "";
           const lockedClass = locked ? "locked" : "";
           const disabled = locked ? "disabled" : "";
           return `
           <div class="player-panel ${decided} ${lockedClass}">
             <div class="pname">${p.nombre}</div>
             <div class="pscore-inline">${p.puntos} pts</div>
             <div class="choice-btns">
               <button class="choice-btn ${selA}" ${disabled}
                 onclick="Game.selectDecision(${p.id},'A')">A</button>
               <button class="choice-btn ${selB}" ${disabled}
                 onclick="Game.selectDecision(${p.id},'B')">B</button>
             </div>
           </div>`;
         })
         .join("");
     },
   
     /* RF-04: Elegir A o B (Sección 14: no doble selección) */
     selectDecision(playerId, decision) {
       if (gameState !== "playing") return;
       players[playerId].decisionActual = decision;
       this.renderPlayers();
   
       if (this.allPlayersAnswered()) {
         document.getElementById("btnReveal").disabled = false;
         UI.setMessage("¡Todos eligieron! Podés revelar el resultado", "ready");
       } else {
         const pending = players.filter((p) => !p.decisionActual).length;
         document.getElementById("btnReveal").disabled = true;
         UI.setMessage(
           `Faltan ${pending} jugador${pending > 1 ? "es" : ""} por elegir`,
           "waiting"
         );
       }
     },
   
     /* RF-05: Verificar todos respondieron */
     allPlayersAnswered() {
       return players.every((p) => p.decisionActual !== null);
     },
   
     /* Fase 5: Revelación (RF-06) */
     revealRound() {
       if (!this.allPlayersAnswered()) return;
       gameState = "revealed";
   
       const card = currentCard;
   
       // Asignar puntos
       players.forEach((p) => {
         const pts = p.decisionActual === "A" ? card.puntosA : card.puntosB;
         p.puntos = Math.max(0, p.puntos + pts); // Regla 7: mínimo 0
         if (pts === 2) p.correctas++;
         else if (pts === 1) p.aceptables++;
         else p.erroneas++; // 0 or -1
       });
   
       // Regla 10: rastrear última crisis
       if (card.tipo === "crisis") {
         const bestOpt = card.puntosA > card.puntosB ? "A" : "B";
         lastCrisisWinners = players
           .filter((p) => p.decisionActual === bestOpt)
           .map((p) => p.id);
       }
   
       // Render result panel
       const resultHTML = this._buildResultHTML(card);
       document.getElementById("resultPanel").innerHTML = resultHTML;
   
       this.renderPlayers();
       Score.update();
   
       // Button state
       document.getElementById("btnReveal").style.display = "none";
       if (currentRound < MAX_ROUNDS) {
         document.getElementById("btnNext").style.display = "";
       } else {
         document.getElementById("btnFinish").style.display = "";
       }
   
       UI.setMessage(`Ronda ${currentRound} completada`, "revealed");
     },
   
     _buildResultHTML(card) {
       // Player chips
       const chips = players
         .map((p) => {
           const pts = p.decisionActual === "A" ? card.puntosA : card.puntosB;
           const cls = pts >= 2 ? "rp-good" : pts === 1 ? "rp-ok" : "rp-bad";
           const sign = pts > 0 ? "+" : "";
           return `<span class="result-player-chip ${cls}">
             ${p.nombre} → ${p.decisionActual}
             <span class="rp-pts">${sign}${pts}</span>
           </span>`;
         })
         .join("");
   
       return `
         <div class="result-panel">
           <h3>Resultado — Ronda ${currentRound}</h3>
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
           <div class="result-players">${chips}</div>
         </div>`;
     },
   
     /* Fase 6: Siguiente ronda */
     nextRound() {
       if (currentRound >= MAX_ROUNDS) return;
       currentRound++;
       Cards.load();
       this.renderRound();
     },
   
     /* Fase 7: Final (RF-08, RF-09) */
     endGame() {
       gameState = "finished";
   
       // Regla 8-9-10: Ranking con desempates
       const sorted = [...players].sort((a, b) => {
         if (b.puntos !== a.puntos) return b.puntos - a.puntos;
         if (b.correctas !== a.correctas) return b.correctas - a.correctas;
         const aWon = lastCrisisWinners.includes(a.id) ? 1 : 0;
         const bWon = lastCrisisWinners.includes(b.id) ? 1 : 0;
         return bWon - aWon;
       });
   
       const winner = sorted[0];
       document.getElementById("winnerName").textContent = winner.nombre;
       document.getElementById("winnerScore").textContent = `${winner.puntos} puntos`;
   
       // Ranking
       document.getElementById("finalRanking").innerHTML = sorted
         .map((p, i) => {
           const posClass = i < 3 ? `rank-${i + 1}` : "";
           return `
             <div class="rank-row ${posClass}">
               <div class="rank-pos">${i + 1}</div>
               <div class="rank-name">${p.nombre}</div>
               <div class="rank-right">
                 <div class="rank-pts">${p.puntos} pts</div>
                 <div class="rank-stats">
                   Óptimas: ${p.correctas} · Aceptables: ${p.aceptables} · Erróneas: ${p.erroneas}
                 </div>
               </div>
             </div>`;
         })
         .join("");
   
       // Awards (Sección 5: estadísticas adicionales)
       const awards = this._calculateAwards(sorted);
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
   
     _calculateAwards(sorted) {
       const awards = [];
   
       // Más decisiones óptimas
       const maxOptimal = Math.max(...players.map((p) => p.correctas));
       const optimalWinner = players.find((p) => p.correctas === maxOptimal);
       if (optimalWinner && maxOptimal > 0) {
         awards.push({
           icon: "🎯",
           title: "Mejor Estratega",
           name: optimalWinner.nombre,
         });
       }
   
       // Mejor en crisis: who got optimal in crisis cards
       // Track this from used cards
       const crisisResults = {};
       players.forEach((p) => (crisisResults[p.id] = 0));
       usedCards.forEach((cardId) => {
         const card = DECK.find((c) => c.id === cardId);
         if (card && card.tipo === "crisis") {
           const bestOpt = card.puntosA > card.puntosB ? "A" : "B";
           // We don't have per-round history, so use correctas as proxy
           // Better: check who has most correctas overall — but let's use a title
         }
       });
       // Use risk proxy — lowest erroneas
       const minErrors = Math.min(...players.map((p) => p.erroneas));
       const cautious = players.find((p) => p.erroneas === minErrors);
       if (cautious) {
         awards.push({
           icon: "🛡️",
           title: "Gestión de Crisis",
           name: cautious.nombre,
         });
       }
   
       // Risk taker — most aceptables (took the "ok" option, not always optimal)
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