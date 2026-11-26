const WORDS = [
    "PYTHON", "TURTLE", "FORWARD", "PENUP", "PENDOWN",
    "RANDOM", "RANDINT", "TIME", "IMPORT", "PYGAME",
    "SPRITE", "SURFACE", "DISPLAY", "CLOCK"
];

const GRID_SIZE = 14;
let board = [];
let foundWords = new Set();
let isSelecting = false;
let startCell = null;
let currentSelection = [];

const gridElement = document.getElementById("grid");
const wordListElement = document.getElementById("word-list");
const resetBtn = document.getElementById("reset-btn");
const statusMessage = document.getElementById("status-message");

// Direcciones posibles: horizontal, vertical y diagonales
const DIRECTIONS = [
    { r: 0, c: 1 },   // Derecha
    { r: 1, c: 0 },   // Abajo
    { r: 1, c: 1 },   // Diagonal abajo-derecha
    { r: -1, c: 1 },  // Diagonal arriba-derecha
    { r: 0, c: -1 },  // Izquierda
    { r: -1, c: 0 },  // Arriba
    { r: -1, c: -1 }, // Diagonal arriba-izquierda
    { r: 1, c: -1 }   // Diagonal abajo-izquierda
];

function initGame() {
    foundWords.clear();
    statusMessage.textContent = "";
    board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
    
    placeWords();
    fillEmptyCells();
    renderBoard();
    renderWordList();
}

function placeWords() {
    // Ordenar palabras de mayor a menor longitud facilita su colocación
    const sortedWords = [...WORDS].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 200) {
            const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            const startRow = Math.floor(Math.random() * GRID_SIZE);
            const startCol = Math.floor(Math.random() * GRID_SIZE);

            if (canPlaceWord(word, startRow, startCol, dir)) {
                for (let i = 0; i < word.length; i++) {
                    const r = startRow + i * dir.r;
                    const c = startCol + i * dir.c;
                    board[r][c] = word[i];
                }
                placed = true;
            }
            attempts++;
        }
    }
}

function canPlaceWord(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
        const r = row + i * dir.r;
        const c = col + i * dir.c;

        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
            return false;
        }
        if (board[r][c] !== "" && board[r][c] !== word[i]) {
            return false;
        }
    }
    return true;
}

function fillEmptyCells() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] === "") {
                board[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
    }
}

function renderBoard() {
    gridElement.innerHTML = "";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.textContent = board[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Eventos de ratón
            cell.addEventListener("mousedown", () => startSelection(r, c));
            cell.addEventListener("mouseenter", () => updateSelection(r, c));

            gridElement.appendChild(cell);
        }
    }
}

function renderWordList() {
    wordListElement.innerHTML = "";
    WORDS.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        li.id = `word-${word}`;
        wordListElement.appendChild(li);
    });
}

function startSelection(r, c) {
    isSelecting = true;
    startCell = { r, c };
    updateSelection(r, c);
}

function updateSelection(endR, endC) {
    if (!isSelecting || !startCell) return;

    clearSelectingHighlight();
    currentSelection = [];

    const dR = endR - startCell.r;
    const dC = endC - startCell.c;

    // Validar que sea línea recta (horizontal, vertical o diagonal exacta)
    if (dR === 0 || dC === 0 || Math.abs(dR) === Math.abs(dC)) {
        const steps = Math.max(Math.abs(dR), Math.abs(dC));
        const stepR = dR === 0 ? 0 : dR / steps;
        const stepC = dC === 0 ? 0 : dC / steps;

        for (let i = 0; i <= steps; i++) {
            const r = startCell.r + i * stepR;
            const c = startCell.c + i * stepC;
            currentSelection.push({ r, c });

            const cellEl = getCellElement(r, c);
            if (cellEl) cellEl.classList.add("selecting");
        }
    }
}

function endSelection() {
    if (!isSelecting) return;
    isSelecting = false;

    const selectedWord = currentSelection.map(pos => board[pos.r][pos.c]).join("");
    const reversedWord = selectedWord.split("").reverse().join("");

    const matchedWord = WORDS.find(
        w => !foundWords.has(w) && (w === selectedWord || w === reversedWord)
    );

    if (matchedWord) {
        foundWords.add(matchedWord);
        currentSelection.forEach(pos => {
            const cellEl = getCellElement(pos.r, pos.c);
            if (cellEl) cellEl.classList.add("found");
        });

        const wordItem = document.getElementById(`word-${matchedWord}`);
        if (wordItem) wordItem.classList.add("found");

        if (foundWords.size === WORDS.length) {
            statusMessage.textContent = "¡Felicidades! Encontraste todos los términos.";
        }
    }

    clearSelectingHighlight();
    currentSelection = [];
    startCell = null;
}

function clearSelectingHighlight() {
    document.querySelectorAll(".cell.selecting").forEach(el => {
        el.classList.remove("selecting");
    });
}

function getCellElement(r, c) {
    return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}

// Eventos globales para finalizar selección y soporte táctil
window.addEventListener("mouseup", endSelection);

gridElement.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains("cell")) {
        startSelection(parseInt(target.dataset.row), parseInt(target.dataset.col));
    }
});

gridElement.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains("cell")) {
        updateSelection(parseInt(target.dataset.row), parseInt(target.dataset.col));
    }
});

window.addEventListener("touchend", endSelection);
resetBtn.addEventListener("click", initGame);

// Iniciar el juego al cargar
initGame();
