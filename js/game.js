// ══════════════════════════════════════════════════════════════
//  CRUCIGRAMA ENGINE  —  game.js
//  Genera un tablero aleatorio cada partida
// ══════════════════════════════════════════════════════════════

const ROWS = 15;
const COLS = 15;
const WORDS_PER_GAME = 10; // cuántas palabras se colocan por partida
const POINTS_PER_WORD = 100;
const PENALTY = 10;        // puntos que se restan por error de verificación

// ── Estado global ──────────────────────────────────────────────
let grid = [];
let WORDS = [];            // palabras colocadas en esta partida
let selectedCell = null;
let selectedDir = 'across';
let solvedWords = new Set();
let errors = 0;
let score = 0;
let seconds = 0;
let timerInterval = null;
let totalCells = 0;
let toastTimeout;

// ══════════════════════════════════════════════════════════════
//  GENERADOR ALEATORIO DE TABLERO
// ══════════════════════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function emptyGrid() {
  const g = [];
  for (let r = 0; r < ROWS; r++) {
    g[r] = [];
    for (let c = 0; c < COLS; c++) {
      g[r][c] = { open: false, answer: '', letter: '', num: null, across: null, down: null };
    }
  }
  return g;
}

function canPlace(tempGrid, word, row, col, dir) {
  // Verifica si la palabra cabe sin conflictos graves
  if (dir === 'across') {
    if (col + word.length > COLS) return false;
    // No debe haber letra adyacente a izquierda/derecha
    if (col > 0 && tempGrid[row][col - 1].open) return false;
    if (col + word.length < COLS && tempGrid[row][col + word.length].open) return false;
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const cell = tempGrid[row][col + i];
      if (cell.open) {
        if (cell.answer !== word[i]) return false; // conflicto de letra
        intersections++;
      } else {
        // No debe tener vecinos arriba/abajo si no es una intersección
        if (row > 0 && tempGrid[row - 1][col + i].open && !cell.open) return false;
        if (row < ROWS - 1 && tempGrid[row + 1][col + i].open && !cell.open) return false;
      }
    }
    // La primera palabra no necesita intersección; las demás sí
    return WORDS.length === 0 || intersections > 0;
  } else { // down
    if (row + word.length > ROWS) return false;
    if (row > 0 && tempGrid[row - 1][col].open) return false;
    if (row + word.length < ROWS && tempGrid[row + word.length][col].open) return false;
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const cell = tempGrid[row + i][col];
      if (cell.open) {
        if (cell.answer !== word[i]) return false;
        intersections++;
      } else {
        if (col > 0 && tempGrid[row + i][col - 1].open && !cell.open) return false;
        if (col < COLS - 1 && tempGrid[row + i][col + 1].open && !cell.open) return false;
      }
    }
    return WORDS.length === 0 || intersections > 0;
  }
}

function placeWord(tempGrid, wordObj, row, col, dir, id) {
  const w = wordObj.word;
  for (let i = 0; i < w.length; i++) {
    const r = dir === 'across' ? row : row + i;
    const c = dir === 'across' ? col + i : col;
    tempGrid[r][c].open = true;
    tempGrid[r][c].answer = w[i];
    if (dir === 'across') tempGrid[r][c].across = id;
    else                  tempGrid[r][c].down   = id;
  }
  WORDS.push({ id, dir, row, col, word: w, clue: wordObj.clue });
}

function generateBoard() {
  WORDS = [];
  const tempGrid = emptyGrid();
  const pool = shuffle(WORD_BANK);
  let placed = 0;
  let attempts = 0;

  for (const wordObj of pool) {
    if (placed >= WORDS_PER_GAME) break;
    const w = wordObj.word;
    const dirs = shuffle(['across', 'down']);
    let success = false;

    for (const dir of dirs) {
      // Intentar hasta 60 posiciones aleatorias
      for (let t = 0; t < 60; t++) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);
        if (canPlace(tempGrid, w, row, col, dir)) {
          placeWord(tempGrid, wordObj, row, col, dir, placed + 1);
          placed++;
          success = true;
          break;
        }
      }
      if (success) break;
    }
    attempts++;
    if (attempts > pool.length) break;
  }

  // Asignar números a celdas de inicio
  WORDS.forEach(w => {
    if (!tempGrid[w.row][w.col].num) tempGrid[w.row][w.col].num = w.id;
  });

  return tempGrid;
}

// ══════════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════════

function renderGrid() {
  const el = document.getElementById('crossword-grid');
  el.style.gridTemplateColumns = `repeat(${COLS}, 36px)`;
  el.style.gridTemplateRows    = `repeat(${ROWS}, 36px)`;
  el.innerHTML = '';

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell' + (grid[r][c].open ? ' open' : '');
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (grid[r][c].open) {
        if (grid[r][c].num) {
          const num = document.createElement('div');
          num.className = 'cell-num';
          num.textContent = grid[r][c].num;
          cell.appendChild(num);
        }
        const letter = document.createElement('div');
        letter.className = 'cell-letter';
        letter.id = `cell-${r}-${c}`;
        cell.appendChild(letter);
        cell.addEventListener('click', () => onCellClick(r, c));
      }
      el.appendChild(cell);
    }
  }
}

function renderClues() {
  const acrossEl = document.getElementById('clues-across');
  const downEl   = document.getElementById('clues-down');
  acrossEl.innerHTML = '';
  downEl.innerHTML = '';

  WORDS.filter(w => w.dir === 'across').forEach(w => acrossEl.appendChild(makeClueItem(w)));
  WORDS.filter(w => w.dir === 'down').forEach(w => downEl.appendChild(makeClueItem(w)));

  document.getElementById('sp-total').textContent = WORDS.length;
  renderWordList();
}

function makeClueItem(w) {
  const div = document.createElement('div');
  div.className = 'clue-item';
  div.id = `clue-${w.dir}-${w.id}`;
  div.innerHTML = `<span class="clue-num">${w.id}</span><span class="clue-text">${w.clue} <span class="clue-letters">(${w.word.length} letras)</span></span>`;
  div.addEventListener('click', () => {
    selectWord(w);
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (!grid[r][c].letter) { selectCell(r, c, w.dir); break; }
    }
    if (!selectedCell) selectCell(w.row, w.col, w.dir);
    focusInput();
  });
  return div;
}

function renderWordList() {
  const el = document.getElementById('word-list');
  if (!el) return;
  el.innerHTML = '';
  const sorted = [...WORDS].sort((a, b) => a.word.localeCompare(b.word));
  sorted.forEach(w => {
    const pill = document.createElement('span');
    pill.className = 'word-pill';
    pill.id = `pill-${w.dir}-${w.id}`;
    pill.textContent = w.word;
    el.appendChild(pill);
  });
}

// ══════════════════════════════════════════════════════════════
//  INTERACCIÓN
// ══════════════════════════════════════════════════════════════

function focusInput() {
  document.getElementById('hidden-input').focus();
}

document.getElementById('hidden-input').addEventListener('keydown', e => {
  if (!selectedCell) return;
  const { r, c } = selectedCell;

  if (e.key === 'Backspace') {
    e.preventDefault();
    if (grid[r][c].letter) setLetter(r, c, '');
    else movePrev(r, c);
    return;
  }
  if (e.key === 'ArrowRight') { e.preventDefault(); selectedDir = 'across'; highlightWord(r, c); return; }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); selectedDir = 'across'; highlightWord(r, c); return; }
  if (e.key === 'ArrowDown')  { e.preventDefault(); selectedDir = 'down';   highlightWord(r, c); return; }
  if (e.key === 'ArrowUp')    { e.preventDefault(); selectedDir = 'down';   highlightWord(r, c); return; }
  if (e.key === 'Tab') { e.preventDefault(); moveNextWord(e.shiftKey); return; }

  const char = e.key.toUpperCase();
  if (/^[A-ZÑ]$/.test(char)) {
    e.preventDefault();
    setLetter(r, c, char);
    moveNext(r, c);
  }
});

document.getElementById('hidden-input').addEventListener('input', e => {
  const val = e.target.value;
  if (val && selectedCell) {
    const char = val[val.length - 1].toUpperCase();
    if (/^[A-ZÁÉÍÓÚÑÜ]$/.test(char)) {
      const mapped = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      setLetter(selectedCell.r, selectedCell.c, mapped);
      moveNext(selectedCell.r, selectedCell.c);
    }
    e.target.value = '';
  }
});

function onCellClick(r, c) {
  if (!grid[r][c].open) return;
  if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
    const hasA = !!getWordForCell(r, c, 'across');
    const hasD = !!getWordForCell(r, c, 'down');
    if (hasA && hasD) selectedDir = selectedDir === 'across' ? 'down' : 'across';
  } else {
    const hasA = !!getWordForCell(r, c, 'across');
    const hasD = !!getWordForCell(r, c, 'down');
    if (!hasA && hasD) selectedDir = 'down';
    else if (hasA && !hasD) selectedDir = 'across';
  }
  selectCell(r, c, selectedDir);
  focusInput();
}

function selectCell(r, c, dir) {
  selectedDir = dir || selectedDir;
  selectedCell = { r, c };
  if (!getWordForCell(r, c, selectedDir)) {
    selectedDir = selectedDir === 'across' ? 'down' : 'across';
  }
  highlightWord(r, c);
  updateClueBar(r, c);
}

function highlightWord(r, c) {
  document.querySelectorAll('.cell.active, .cell.highlighted').forEach(el => el.classList.remove('active', 'highlighted'));
  document.querySelectorAll('.clue-item.clue-active').forEach(el => el.classList.remove('clue-active'));

  const w = getWordForCell(r, c, selectedDir);
  if (!w) return;
  for (let i = 0; i < w.word.length; i++) {
    const wr = w.dir === 'across' ? w.row : w.row + i;
    const wc = w.dir === 'across' ? w.col + i : w.col;
    const cellEl = getCellEl(wr, wc);
    if (cellEl) cellEl.classList.add('highlighted');
  }
  const cellEl = getCellEl(r, c);
  if (cellEl) { cellEl.classList.remove('highlighted'); cellEl.classList.add('active'); }
  const clueEl = document.getElementById(`clue-${w.dir}-${w.id}`);
  if (clueEl) { clueEl.classList.add('clue-active'); clueEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}

function updateClueBar(r, c) {
  const w = getWordForCell(r, c, selectedDir);
  if (w) {
    document.getElementById('cur-num').textContent = w.id + (w.dir === 'across' ? '→' : '↓');
    document.getElementById('cur-clue').textContent = w.clue;
  }
}

function getWordForCell(r, c, dir) {
  return WORDS.find(w => {
    if (w.dir !== dir) return false;
    for (let i = 0; i < w.word.length; i++) {
      const wr = w.dir === 'across' ? w.row : w.row + i;
      const wc = w.dir === 'across' ? w.col + i : w.col;
      if (wr === r && wc === c) return true;
    }
    return false;
  });
}

function getCellEl(r, c) {
  return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

function setLetter(r, c, letter) {
  grid[r][c].letter = letter;
  const el = document.getElementById(`cell-${r}-${c}`);
  if (el) {
    el.textContent = letter;
    el.className = 'cell-letter';
  }
  // Quitar marcas de error previas
  const cellEl = getCellEl(r, c);
  if (cellEl) cellEl.classList.remove('wrong-cell', 'correct');

  checkWordComplete();
  updateProgress();
}

function moveNext(r, c) {
  if (selectedDir === 'across') {
    if (c + 1 < COLS && grid[r][c + 1].open) selectCell(r, c + 1, 'across');
  } else {
    if (r + 1 < ROWS && grid[r + 1][c].open) selectCell(r + 1, c, 'down');
  }
}

function movePrev(r, c) {
  if (selectedDir === 'across') {
    if (c - 1 >= 0 && grid[r][c - 1].open) { selectCell(r, c - 1, 'across'); setLetter(r, c - 1, ''); }
  } else {
    if (r - 1 >= 0 && grid[r - 1][c].open) { selectCell(r - 1, c, 'down'); setLetter(r - 1, c, ''); }
  }
}

function moveNextWord(reverse = false) {
  const currentIdx = WORDS.findIndex(w => {
    if (!selectedCell || w.dir !== selectedDir) return false;
    const { r, c } = selectedCell;
    for (let i = 0; i < w.word.length; i++) {
      const wr = w.dir === 'across' ? w.row : w.row + i;
      const wc = w.dir === 'across' ? w.col + i : w.col;
      if (wr === r && wc === c) return true;
    }
    return false;
  });
  const nextIdx = (currentIdx + (reverse ? -1 : 1) + WORDS.length) % WORDS.length;
  const nw = WORDS[nextIdx];
  selectCell(nw.row, nw.col, nw.dir);
}

function selectWord(w) {
  selectedDir = w.dir;
  selectCell(w.row, w.col, w.dir);
}

// ══════════════════════════════════════════════════════════════
//  LÓGICA DE JUEGO
// ══════════════════════════════════════════════════════════════

function checkWordComplete() {
  WORDS.forEach(w => {
    const key = `${w.dir}-${w.id}`;
    if (solvedWords.has(key)) return;
    let complete = true;
    for (let i = 0; i < w.word.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (grid[r][c].letter !== w.word[i]) { complete = false; break; }
    }
    if (complete) {
      solvedWords.add(key);
      score += POINTS_PER_WORD;
      updateScoreDisplay();

      const clueEl = document.getElementById(`clue-${w.dir}-${w.id}`);
      if (clueEl) clueEl.classList.add('clue-solved');

      const pill = document.getElementById(`pill-${w.dir}-${w.id}`);
      if (pill) pill.classList.add('pill-solved');

      for (let i = 0; i < w.word.length; i++) {
        const r = w.dir === 'across' ? w.row : w.row + i;
        const c = w.dir === 'across' ? w.col + i : w.col;
        const el = document.getElementById(`cell-${r}-${c}`);
        if (el) el.classList.add('correct-letter');
        const cellEl = getCellEl(r, c);
        if (cellEl) cellEl.classList.add('correct');
      }
      document.getElementById('sp-solved').textContent = solvedWords.size;
      showToast(`✓ ¡Palabra ${w.id} correcta! +${POINTS_PER_WORD} pts`);
    }
  });
  if (solvedWords.size === WORDS.length) setTimeout(showWin, 400);
}

function updateProgress() {
  let filled = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c].open && grid[r][c].letter) filled++;
  const pct = Math.round((filled / totalCells) * 100);
  document.getElementById('progress-bar').style.width = pct + '%';
}

function updateScoreDisplay() {
  const el = document.getElementById('sp-score');
  if (el) el.textContent = score;
}

function checkAll() {
  let wrong = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c].open || !grid[r][c].letter) continue;
      const el = document.getElementById(`cell-${r}-${c}`);
      const cellEl = getCellEl(r, c);
      if (grid[r][c].letter === grid[r][c].answer) {
        if (el) el.classList.add('correct-letter');
        if (cellEl) cellEl.classList.add('correct');
      } else {
        if (el) el.classList.add('wrong-letter');
        if (cellEl) cellEl.classList.add('wrong-cell');
        wrong++;
        errors++;
        score = Math.max(0, score - PENALTY);
      }
    }
  }
  updateScoreDisplay();
  if (wrong === 0) showToast('✓ ¡Todo correcto hasta ahora!');
  else showToast(`✗ ${wrong} letra(s) incorrecta(s) — -${wrong * PENALTY} pts`);
  checkWordComplete();
}

function revealAll() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c].open) continue;
      setLetter(r, c, grid[r][c].answer);
      const el = document.getElementById(`cell-${r}-${c}`);
      if (el) el.classList.add('correct-letter');
      const cellEl = getCellEl(r, c);
      if (cellEl) { cellEl.classList.remove('wrong-cell'); cellEl.classList.add('correct'); }
    }
  }
  checkWordComplete();
  updateProgress();
}

function resetGame() {
  // Limpiar estado
  solvedWords.clear();
  errors = 0;
  score = 0;
  seconds = 0;
  clearInterval(timerInterval);

  document.getElementById('sp-solved').textContent = '0';
  document.getElementById('sp-time').textContent = '00:00';
  document.getElementById('progress-bar').style.width = '0%';
  updateScoreDisplay();

  // Regenerar tablero
  grid = generateBoard();

  // Contar celdas abiertas
  totalCells = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid[r][c].open) totalCells++;

  renderGrid();
  renderClues();

  selectedCell = null;
  document.getElementById('cur-num').textContent = '—';
  document.getElementById('cur-clue').textContent = 'Haz clic en una celda para comenzar';

  startTimer();
}

// ══════════════════════════════════════════════════════════════
//  TEMPORIZADOR
// ══════════════════════════════════════════════════════════════

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('sp-time').textContent = `${m}:${s}`;
  }, 1000);
}

// ══════════════════════════════════════════════════════════════
//  FIN DE JUEGO
// ══════════════════════════════════════════════════════════════

function showWin() {
  clearInterval(timerInterval);
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  document.getElementById('w-time').textContent = `${m}:${s}`;
  document.getElementById('w-errors').textContent = errors;
  document.getElementById('w-score').textContent = score;
  document.getElementById('win-modal').classList.add('show');
}

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2500);
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  resetGame();
});
