/* ==========================================================================
   TicTacToe AI — Combined Game Engine & UI Logic (Task 2 - CodSoft)
   ========================================================================== */

/* ==========================================================================
   PART 1: Background Particle Constellation Engine (particles.js)
   ========================================================================== */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  let particles = [];
  let mouse = {
    x: null,
    y: null,
    radius: 120, // Interaction radius
    active: false
  };

  // Configuration
  const PARTICLE_COUNT_DESKTOP = 65;
  const PARTICLE_COUNT_MOBILE = 25;
  const CONNECTION_DIST = 110; // Max distance for drawing links
  const PARTICLE_SPEED = 0.45;
  
  // Theme colors matching CSS
  const COLOR_PARTICLE = 'rgba(163, 199, 255, 0.28)'; // Soft ice blue
  const COLOR_LINE_BASE = 'rgba(0, 240, 255, '; // Cyan for links (alpha appended dynamically)

  // Particle representation
  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initPhase = false) {
      this.radius = Math.random() * 2 + 1;
      
      if (initPhase) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
      } else {
        // Spawn from edges when recycling
        if (Math.random() > 0.5) {
          this.x = Math.random() > 0.5 ? 0 : canvas.width;
          this.y = Math.random() * canvas.height;
        } else {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() > 0.5 ? 0 : canvas.height;
        }
      }

      this.vx = (Math.random() - 0.5) * PARTICLE_SPEED;
      this.vy = (Math.random() - 0.5) * PARTICLE_SPEED;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce/recycle check
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.reset(false);
      }

      // Mouse attraction micro-interaction
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          // Gentle pull toward cursor
          this.x += (dx / distance) * force * 0.4;
          this.y += (dy / distance) * force * 0.4;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_PARTICLE;
      ctx.fill();
    }
  }

  // Adjust canvas bounds to match browser viewport
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Recalculate particle density
    const count = canvas.width < 800 ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;
    initParticles(count);
  }

  function initParticles(count) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  // Setup Event Listeners
  window.addEventListener('resize', resizeCanvas);
  
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
    mouse.active = false;
  });

  // Main animation frame tick
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // Draw connecting paths (Neural network constellation lines)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONNECTION_DIST) {
          // Opacity decreases linearly as separation increases
          const opacity = (1 - dist / CONNECTION_DIST) * 0.16;
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `${COLOR_LINE_BASE}${opacity})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    // Pulse mouse halo (ultra subtle glow circle under cursor)
    if (mouse.active && mouse.x !== null && mouse.y !== null) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.015)';
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  // Initialization
  resizeCanvas();
  requestAnimationFrame(animate);
})();


/* ==========================================================================
   PART 2: AI Decision-Making & Game-State Logic (ai.js)
   ========================================================================== */
const TicTacToeAI = (function () {
  
  // Winning combinations matching index positions 0-8
  const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  /**
   * Evaluates if a specific player has won the game.
   */
  function checkWin(board, player) {
    return WIN_COMBOS.some(combo => 
      combo.every(index => board[index] === player)
    );
  }

  /**
   * Helper to fetch indices of all empty cells on the board.
   */
  function getEmptyIndices(board) {
    return board.reduce((acc, cell, index) => {
      if (cell === null || cell === "") {
        acc.push(index);
      }
      return acc;
    }, []);
  }

  /**
   * Evaluates if the board is in a draw state (no moves left and no winner).
   */
  function checkDraw(board) {
    return getEmptyIndices(board).length === 0 && !checkWin(board, 'X') && !checkWin(board, 'O');
  }

  /**
   * MINIMAX ALGORITHM: Recursive game-tree search for unbeatable execution.
   * Maximizer is AI ('O'), Minimizer is Human ('X').
   */
  function minimax(board, depth, isMaximizing) {
    // Base Terminal States
    if (checkWin(board, 'O')) return 10 - depth; // Win sooner is better
    if (checkWin(board, 'X')) return depth - 10; // Lose later is better
    if (getEmptyIndices(board).length === 0) return 0; // Draw

    if (isMaximizing) {
      let bestScore = -Infinity;
      const moves = getEmptyIndices(board);
      for (let i = 0; i < moves.length; i++) {
        board[moves[i]] = 'O'; // Simulate AI move
        const score = minimax(board, depth + 1, false);
        board[moves[i]] = null; // Undo move
        bestScore = Math.max(bestScore, score);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      const moves = getEmptyIndices(board);
      for (let i = 0; i < moves.length; i++) {
        board[moves[i]] = 'X'; // Simulate Human move
        const score = minimax(board, depth + 1, true);
        board[moves[i]] = null; // Undo move
        bestScore = Math.min(bestScore, score);
      }
      return bestScore;
    }
  }

  /**
   * Computes the absolute best move using Minimax.
   */
  function getHardMove(board) {
    let bestScore = -Infinity;
    let bestMove = null;
    const availableMoves = getEmptyIndices(board);

    // If board is completely empty, pick center or corner instantly (performance bypass)
    if (availableMoves.length === 9) {
      const openingMoves = [4, 0, 2, 6, 8];
      return openingMoves[Math.floor(Math.random() * openingMoves.length)];
    }

    for (let i = 0; i < availableMoves.length; i++) {
      const move = availableMoves[i];
      board[move] = 'O'; // Try move
      const score = minimax(board, 0, false);
      board[move] = null; // Undo move

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  /**
   * Checks if an immediate winning or blocking move exists for a specific player.
   */
  function findWinningOrBlockingMove(board, player) {
    const availableMoves = getEmptyIndices(board);
    for (let i = 0; i < availableMoves.length; i++) {
      const move = availableMoves[i];
      board[move] = player; // Simulate play
      const isWin = checkWin(board, player);
      board[move] = null; // Revert
      if (isWin) {
        return move;
      }
    }
    return null;
  }

  /**
   * Heuristic strategic selector (Medium Difficulty).
   */
  function getMediumMove(board) {
    // 1. Take immediate win if available
    const winMove = findWinningOrBlockingMove(board, 'O');
    if (winMove !== null) return winMove;

    // 2. Block immediate opponent win if threatened
    const blockMove = findWinningOrBlockingMove(board, 'X');
    if (blockMove !== null) return blockMove;

    const availableMoves = getEmptyIndices(board);

    // 3. Take center cell with high priority (60% chance if open)
    if (availableMoves.includes(4) && Math.random() < 0.6) {
      return 4;
    }

    // 4. Take corners with priority
    const corners = [0, 2, 6, 8].filter(c => availableMoves.includes(c));
    if (corners.length > 0 && Math.random() < 0.5) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Otherwise, random empty space
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  /**
   * Casual easy selector with high mistake rates.
   */
  function getEasyMove(board) {
    const availableMoves = getEmptyIndices(board);

    // 40% chance of basic strategy (will take immediate win/block if they see it)
    if (Math.random() < 0.4) {
      const winMove = findWinningOrBlockingMove(board, 'O');
      if (winMove !== null) return winMove;

      const blockMove = findWinningOrBlockingMove(board, 'X');
      if (blockMove !== null) return blockMove;
    }

    // Otherwise, 60% chance of absolute random choice (beginner mistakes)
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  /**
   * Public API
   * Computes index of the AI's move.
   * @param {Array} board - Representation of the grid (size 9).
   * @param {string} difficulty - "easy", "medium", or "hard".
   * @returns {number} Selected grid index (0-8).
   */
  function getAIMove(board, difficulty) {
    switch (difficulty) {
      case 'easy':
        return getEasyMove(board);
      case 'medium':
        return getMediumMove(board);
      case 'hard':
      default:
        return getHardMove(board);
    }
  }

  return {
    getAIMove: getAIMove,
    checkWin: checkWin,
    checkDraw: checkDraw,
    WIN_COMBOS: WIN_COMBOS
  };

})();


/* ==========================================================================
   PART 3: Main Application Controller & State Manager (app.js)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  
  // --- DOM Elements ---
  const screens = {
    landing: document.getElementById('screen-landing'),
    difficulty: document.getElementById('screen-difficulty'),
    game: document.getElementById('screen-game')
  };

  const buttons = {
    start: document.getElementById('btn-start'),
    difficultyBack: document.getElementById('btn-difficulty-back'),
    backMenu: document.getElementById('btn-back-menu'),
    restart: document.getElementById('btn-restart')
  };

  const labels = {
    difficultyVal: document.getElementById('game-difficulty-val'),
    scorePlayer: document.getElementById('score-player'),
    scoreDraw: document.getElementById('score-draw'),
    scoreAi: document.getElementById('score-ai'),
    statusText: document.getElementById('game-status-text')
  };

  const cards = {
    player: document.getElementById('player-score-card'),
    ai: document.getElementById('ai-score-card'),
    draw: document.getElementById('draw-score-card')
  };

  const boardElement = document.getElementById('board');
  const cells = document.querySelectorAll('.cell');
  const winLine = document.getElementById('win-line');

  // --- Game State Variables ---
  let boardState = Array(9).fill(null); // 'X' for human, 'O' for AI, null for empty
  let isGameActive = false;
  let currentDifficulty = 'hard'; // default selection
  let activeTurn = 'X'; // X starts the round
  let scores = { player: 0, draw: 0, ai: 0 };

  // SVG Markups for dynamic injection
  const SVG_X = `
    <svg class="symbol-x" viewBox="0 0 52 52">
      <path d="M16,16 L36,36 M36,16 L16,36" />
    </svg>
  `;
  const SVG_O = `
    <svg class="symbol-o" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r="16" />
    </svg>
  `;

  // --- Navigation & Page Control ---
  
  function switchScreen(toScreenName) {
    // Transition opacity and visibility
    Object.keys(screens).forEach(key => {
      if (key === toScreenName) {
        screens[key].classList.add('active');
      } else {
        screens[key].classList.remove('active');
      }
    });
  }

  // --- Premium Micro-interactions: Mouse Spotlight ---
  document.querySelectorAll('.difficulty-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });

  // --- Gameplay Controller ---

  function startNewRound() {
    boardState = Array(9).fill(null);
    isGameActive = true;
    activeTurn = 'X';

    // Clear UI Board elements
    cells.forEach(cell => {
      cell.innerHTML = '';
      cell.classList.remove('win-highlight');
      cell.removeAttribute('disabled');
    });

    // Reset status label & card highlights
    labels.statusText.textContent = "Your Turn";
    labels.statusText.classList.remove('thinking');
    
    cards.player.classList.add('active-turn');
    cards.ai.classList.remove('active-turn');

    // Reset Laser Win Overlay
    winLine.classList.remove('active-line');
    winLine.setAttribute('x1', '0');
    winLine.setAttribute('y1', '0');
    winLine.setAttribute('x2', '0');
    winLine.setAttribute('y2', '0');
  }

  function handleCellClick(e) {
    const cellIndex = parseInt(e.target.getAttribute('data-index'));

    // Move is only valid if game is active, cell is empty, and it is human's turn
    if (boardState[cellIndex] !== null || !isGameActive || activeTurn !== 'X') {
      return;
    }

    executeMove(cellIndex, 'X');
  }

  function executeMove(index, player) {
    boardState[index] = player;
    const cell = cells[index];
    
    // Inject corresponding SVG Symbol
    cell.innerHTML = player === 'X' ? SVG_X : SVG_O;
    cell.setAttribute('disabled', 'true');

    // Evaluate Win/Draw Condition
    if (TicTacToeAI.checkWin(boardState, player)) {
      handleGameOver(player);
    } else if (TicTacToeAI.checkDraw(boardState)) {
      handleGameOver('draw');
    } else {
      // Toggle active turn
      if (player === 'X') {
        activeTurn = 'O';
        triggerAIMove();
      } else {
        activeTurn = 'X';
        labels.statusText.textContent = "Your Turn";
        labels.statusText.classList.remove('thinking');
        cards.player.classList.add('active-turn');
        cards.ai.classList.remove('active-turn');
      }
    }
  }

  function triggerAIMove() {
    labels.statusText.textContent = "AI is thinking...";
    labels.statusText.classList.add('thinking');
    
    cards.player.classList.remove('active-turn');
    cards.ai.classList.add('active-turn');

    // Human-like computational delay (500ms to 900ms) for professional realism
    const thinkingDelay = Math.floor(Math.random() * 400) + 500;
    
    setTimeout(() => {
      if (!isGameActive) return; // Prevent play if round was restarted during thinking delay

      const aiMove = TicTacToeAI.getAIMove(boardState, currentDifficulty);
      if (aiMove !== null && aiMove !== undefined) {
        executeMove(aiMove, 'O');
      }
    }, thinkingDelay);
  }

  function handleGameOver(winner) {
    isGameActive = false;
    
    // Disallow clicks on all cells
    cells.forEach(cell => cell.setAttribute('disabled', 'true'));
    
    // Remove active turn glows
    cards.player.classList.remove('active-turn');
    cards.ai.classList.remove('active-turn');

    if (winner === 'draw') {
      scores.draw++;
      labels.scoreDraw.textContent = scores.draw;
      labels.statusText.textContent = "It's a Draw";
    } else {
      // Update scores
      if (winner === 'X') {
        scores.player++;
        labels.scorePlayer.textContent = scores.player;
        labels.statusText.textContent = "You Win!";
      } else {
        scores.ai++;
        labels.scoreAi.textContent = scores.ai;
        labels.statusText.textContent = "AI Core Wins";
      }

      // Highlight winning visual track
      highlightWinCombo(winner);
    }
  }

  function highlightWinCombo(winner) {
    // Find the winning combination indices
    const combo = TicTacToeAI.WIN_COMBOS.find(c => 
      c.every(index => boardState[index] === winner)
    );

    if (!combo) return;

    // Highlight cells
    combo.forEach(idx => {
      cells[idx].classList.add('win-highlight');
    });

    // Map combo pattern to Laser Coordinates inside 300x300 Board
    let coords = { x1: 0, y1: 0, x2: 0, y2: 0 };
    const [c1, c2, c3] = combo;

    // Horizontal Row matches: [0,1,2], [3,4,5], [6,7,8]
    if (c1 === 0 && c2 === 1 && c3 === 2) coords = { x1: 15, y1: 50, x2: 285, y2: 50 };
    else if (c1 === 3 && c2 === 4 && c3 === 5) coords = { x1: 15, y1: 150, x2: 285, y2: 150 };
    else if (c1 === 6 && c2 === 7 && c3 === 8) coords = { x1: 15, y1: 250, x2: 285, y2: 250 };
    
    // Vertical Column matches: [0,3,6], [1,4,7], [2,5,8]
    else if (c1 === 0 && c2 === 3 && c3 === 6) coords = { x1: 50, y1: 15, x2: 50, y2: 285 };
    else if (c1 === 1 && c2 === 4 && c3 === 7) coords = { x1: 150, y1: 15, x2: 150, y2: 285 };
    else if (c1 === 2 && c2 === 5 && c3 === 8) coords = { x1: 250, y1: 15, x2: 250, y2: 285 };
    
    // Diagonal matches: [0,4,8], [2,4,6]
    else if (c1 === 0 && c2 === 4 && c3 === 8) coords = { x1: 20, y1: 20, x2: 280, y2: 280 };
    else if (c1 === 2 && c2 === 4 && c3 === 6) coords = { x1: 280, y1: 20, x2: 20, y2: 280 };

    // Update win SVG Laser values
    winLine.setAttribute('x1', coords.x1);
    winLine.setAttribute('y1', coords.y1);
    winLine.setAttribute('x2', coords.x2);
    winLine.setAttribute('y2', coords.y2);
    
    // Animate line in
    setTimeout(() => {
      winLine.classList.add('active-line');
    }, 50);
  }

  // --- Button & Interaction Event Handlers ---

  // Welcome Screen -> Difficulty Screen
  buttons.start.addEventListener('click', () => {
    switchScreen('difficulty');
  });

  // Difficulty Screen -> Welcome Screen
  buttons.difficultyBack.addEventListener('click', () => {
    switchScreen('landing');
  });

  // Difficulty selection clicks
  document.querySelectorAll('.difficulty-card').forEach(card => {
    card.addEventListener('click', () => {
      // Add visual active state
      card.classList.add('selected-card');

      setTimeout(() => {
        // Retrieve chosen difficulty
        currentDifficulty = card.getAttribute('data-difficulty');
        
        // Update Difficulty badges
        labels.difficultyVal.textContent = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
        
        // Reset scores for fresh difficulty
        scores = { player: 0, draw: 0, ai: 0 };
        labels.scorePlayer.textContent = '0';
        labels.scoreDraw.textContent = '0';
        labels.scoreAi.textContent = '0';

        // Prepare and swap to game
        startNewRound();
        switchScreen('game');
        
        // Cleanup selection state for next menu visits
        card.classList.remove('selected-card');
      }, 350); // Delay allows click selection animation to breathe
    });
  });

  // Game Screen -> Restart Round
  buttons.restart.addEventListener('click', () => {
    // Restart animation trigger
    buttons.restart.classList.add('rotating');
    startNewRound();
    setTimeout(() => {
      buttons.restart.classList.remove('rotating');
    }, 600);
  });

  // Game Screen -> Exit to Selection Menu
  buttons.backMenu.addEventListener('click', () => {
    isGameActive = false;
    switchScreen('difficulty');
  });

  // Connect board cell click listeners
  boardElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('cell')) {
      handleCellClick(e);
    }
  });

});
