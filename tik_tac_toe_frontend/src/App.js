import React, { useState } from 'react';
import './App.css';

// --- COLOR CONSTANTS (matches requirement) ---
const PRIMARY = 'var(--primary)';
const ACCENT = 'var(--accent)';
const SECONDARY = 'var(--surface)';
const TXT_COLOR = 'var(--text-color)';
const TXT_SECONDARY = 'var(--text-secondary)';

// Square component with light animation
// PUBLIC_INTERFACE
function Square({ value, onClick, highlight, disabled }) {
  /**
   * Renders a single square in the game board.
   * @param {string|null} value - 'X', 'O', or null.
   * @param {function} onClick - Click handler.
   * @param {boolean} highlight - If true, the square is part of the winning combination.
   * @param {boolean} disabled - If true, square is disabled.
   */
  return (
    <button
      className={`ttt-square${highlight ? ' win' : ''}`}
      style={{
        color: value === 'X' ? PRIMARY : value === 'O' ? ACCENT : undefined,
        background: highlight ? 'rgba(25, 118, 210, 0.12)' : SECONDARY,
        cursor: disabled || value !== null ? 'not-allowed' : 'pointer',
        transition: 'background 0.3s, box-shadow 0.3s',
        animation: value ? 'pop-in 0.2s' : undefined,
      }}
      onClick={onClick}
      disabled={disabled || value !== null}
      aria-label={value ? `Square with ${value}` : 'Empty square'}
    >
      {value}
    </button>
  );
}

// Board component
// PUBLIC_INTERFACE
function Board({ squares, onSquareClick, winnerLine, disableAll }) {
  /**
   * Renders the 3x3 tic tac toe board.
   * @param {Array} squares - Array of 9 elements: null, 'X', or 'O'.
   * @param {function} onSquareClick - Handler for square click, accepts index.
   * @param {Array|null} winnerLine - Array of winning square indexes or null.
   * @param {boolean} disableAll - Disables all squares if true.
   */
  function renderSquare(i) {
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onSquareClick(i)}
        highlight={winnerLine && winnerLine.includes(i)}
        disabled={disableAll}
      />
    );
  }

  // Grid 3x3
  let boardRows = [];
  for (let row = 0; row < 3; row++) {
    let cells = [];
    for (let col = 0; col < 3; col++) {
      cells.push(renderSquare(row * 3 + col));
    }
    boardRows.push(
      <div className="ttt-board-row" key={row}>
        {cells}
      </div>
    );
  }

  return <div className="ttt-board">{boardRows}</div>;
}

// Helper: Calculate winner or draw
function calculateWinner(squares) {
  // Returns {winner: 'X'|'O', line: [idx, ...]} or null for no win, or {draw: true}
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diags
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return { winner: squares[a], line };
    }
  }
  if (squares.every(sq => sq !== null)) {
    return { draw: true };
  }
  return null;
}

// AI: Very simple computer logic (random empty/first empty)
// PUBLIC_INTERFACE
function computerMove(squares, symbol) {
  /**
   * Returns index for computer's move. Simple AI: Pick first found empty spot.
   */
  const emptyIndices = squares
    .map((v, i) => (v === null ? i : null))
    .filter(i => i !== null);
  // Can be improved to smarter AI if wanted.
  if (emptyIndices.length === 0) return null;
  // Random move for variety:
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// Game Controls below board
// PUBLIC_INTERFACE
function Controls({
  mode,
  setMode,
  onReset,
  xIsNext,
  gameOver,
  playerSymbol,
  setPlayerSymbol,
  disableSideButtons,
}) {
  /**
   * Renders below-board controls:
   * - PvP / PvC switch
   * - Reset button
   * - Symbol picker (in PvC, pick X or O)
   */
  return (
    <div className="ttt-controls">
      <div className="ttt-modes">
        <button
          className={mode === 'pvp' ? 'active-mode' : ''}
          style={{ background: mode === 'pvp' ? PRIMARY : '#e3eaf7', color: mode === 'pvp' ? SECONDARY : PRIMARY }}
          onClick={() => setMode('pvp')}
          disabled={disableSideButtons}
        >
          Player vs Player
        </button>
        <button
          className={mode === 'pvc' ? 'active-mode' : ''}
          style={{ background: mode === 'pvc' ? PRIMARY : '#e3eaf7', color: mode === 'pvc' ? SECONDARY : PRIMARY }}
          onClick={() => setMode('pvc')}
          disabled={disableSideButtons}
        >
          Player vs Computer
        </button>
      </div>
      {mode === 'pvc' && (
        <div className="ttt-symbol-pick">
          <span>Play as: </span>
          <button
            style={{
              background: playerSymbol === 'X' ? ACCENT : '#ffeaea',
              color: playerSymbol === 'X' ? SECONDARY : ACCENT,
              marginRight: 8,
              fontWeight: playerSymbol === 'X' ? 700 : 400,
            }}
            onClick={() => setPlayerSymbol('X')}
            disabled={disableSideButtons}
          >
            X
          </button>
          <button
            style={{
              background: playerSymbol === 'O' ? ACCENT : '#ffeaea',
              color: playerSymbol === 'O' ? SECONDARY : ACCENT,
              fontWeight: playerSymbol === 'O' ? 700 : 400,
            }}
            onClick={() => setPlayerSymbol('O')}
            disabled={disableSideButtons}
          >
            O
          </button>
        </div>
      )}
      <button className="ttt-reset-btn" onClick={onReset} aria-label="Reset Game">
        Reset Game
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Main app for the Tik Tac Toe game. Provides status, controls, game board, layout, and light-theme styling.
   * Responsive and centered layout.
   */
  // Game state
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [mode, setMode] = useState('pvp'); // 'pvp' or 'pvc'
  const [playerSymbol, setPlayerSymbol] = useState('X'); // Only for PvC: can play as X or O
  const [statusAnim, setStatusAnim] = useState(false); // Animate status change

  // Derive winner/draw/gameOver
  const outcome = calculateWinner(squares);
  const winner = outcome && outcome.winner;
  const winnerLine = outcome && outcome.line;
  const draw = outcome && outcome.draw;
  const gameOver = !!winner || !!draw;

  // Which symbol is next
  let current;
  if (gameOver) {
    if (winner) current = winner;
    else if (draw) current = null;
  } else {
    current = isXNext ? 'X' : 'O';
  }

  // Handle square click
  // PUBLIC_INTERFACE
  function handleSquareClick(i) {
    if (gameOver || squares[i]) return;
    const nextSquares = squares.slice();
    nextSquares[i] = current;
    setSquares(nextSquares);
    setIsXNext(!isXNext);
    setStatusAnim(true);
  }

  // Effect: Computer makes a move after player if in PvC, not over, and it's computer's turn
  React.useEffect(() => {
    let timeout;
    if (
      mode === 'pvc' &&
      !gameOver &&
      ((playerSymbol === 'X' && !isXNext) || (playerSymbol === 'O' && isXNext))
    ) {
      timeout = setTimeout(() => {
        const aiSymbol = isXNext ? 'X' : 'O';
        const idx = computerMove(squares, aiSymbol);
        if (idx !== null) handleSquareClick(idx);
      }, 400); // Delay for realism/animation
    }
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [isXNext, mode, playerSymbol, squares, gameOver]);

  // Effect: Animate status on change
  React.useEffect(() => {
    if (!statusAnim) return;
    const timeout = setTimeout(() => setStatusAnim(false), 350);
    return () => clearTimeout(timeout);
  }, [statusAnim]);

  // Status message
  let statusMsg;
  if (winner) {
    statusMsg = `Winner: ${winner === 'X' ? '❌ X' : '⭕ O'}`;
  } else if (draw) {
    statusMsg = "It's a draw!";
  } else if (mode === 'pvc') {
    if ((isXNext && playerSymbol === 'X') || (!isXNext && playerSymbol === 'O')) {
      statusMsg = "Your turn";
    } else {
      statusMsg = "Computer's turn";
    }
  } else {
    statusMsg = `Next player: ${current === 'X' ? '❌ X' : '⭕ O'}`;
  }

  // PUBLIC_INTERFACE
  function handleReset() {
    setSquares(Array(9).fill(null));
    setIsXNext(true);
    setStatusAnim(true);
  }

  // PUBLIC_INTERFACE
  function handleModeChange(newMode) {
    setMode(newMode);
    handleReset();
  }

  // PUBLIC_INTERFACE
  function handleSymbolChange(sym) {
    setPlayerSymbol(sym);
    handleReset();
  }

  // Centered responsive layout
  return (
    <div className="ttt-app-root">
      <div className="ttt-app-main">
        <h1 className="ttt-title">Tik Tac Toe</h1>
        <div className={`ttt-status${statusAnim ? ' pulse' : ''}`}>
          {statusMsg}
        </div>
        <Board
          squares={squares}
          onSquareClick={idx => {
            if (
              (mode === 'pvc' &&
                ((isXNext && playerSymbol === 'O') || (!isXNext && playerSymbol === 'X')))
            ) {
              // In PvC: block player from going on computer's turn
              return;
            }
            handleSquareClick(idx);
          }}
          winnerLine={winnerLine}
          disableAll={gameOver}
        />
        <Controls
          mode={mode}
          setMode={handleModeChange}
          onReset={handleReset}
          xIsNext={isXNext}
          gameOver={gameOver}
          playerSymbol={playerSymbol}
          setPlayerSymbol={handleSymbolChange}
          disableSideButtons={false}
        />
        <div className="ttt-footer">
          <span>
            <a 
              href="https://reactjs.org/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Built with React
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
