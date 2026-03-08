/** @jsxImportSource react */
import { useEffect, useMemo, useState } from 'react'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'
import GameModeToggle, { type GameMode } from './GameModeToggle'
import GameShell from './GameShell'

type Disc = 'R' | 'Y' | null

const ROWS = 6
const COLUMNS = 7
const WIN_LENGTH = 4
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]
const CENTER_PRIORITY_COLUMNS: ReadonlyArray<number> = [3, 2, 4, 1, 5, 0, 6]
const HARD_SEARCH_DEPTH = 5

function getCellIndex(row: number, column: number) {
  return row * COLUMNS + column
}

function getDropRow(board: Disc[], column: number) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (!board[getCellIndex(row, column)]) {
      return row
    }
  }

  return -1
}

function simulateDrop(board: Disc[], column: number, disc: Exclude<Disc, null>) {
  const targetRow = getDropRow(board, column)
  if (targetRow < 0) {
    return null
  }

  const targetIndex = getCellIndex(targetRow, column)
  const nextBoard = [...board]
  nextBoard[targetIndex] = disc
  return { nextBoard, targetIndex }
}

function getAvailableColumns(board: Disc[]) {
  return CENTER_PRIORITY_COLUMNS.filter((column) => getDropRow(board, column) >= 0)
}

function getWinner(board: Disc[]): Exclude<Disc, null> | null {
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const currentDisc = board[getCellIndex(row, column)]

      if (!currentDisc) {
        continue
      }

      for (const [rowStep, columnStep] of DIRECTIONS) {
        let matches = 1

        while (matches < WIN_LENGTH) {
          const nextRow = row + rowStep * matches
          const nextColumn = column + columnStep * matches

          if (nextRow < 0 || nextRow >= ROWS || nextColumn < 0 || nextColumn >= COLUMNS) {
            break
          }

          if (board[getCellIndex(nextRow, nextColumn)] !== currentDisc) {
            break
          }

          matches += 1
        }

        if (matches === WIN_LENGTH) {
          return currentDisc
        }
      }
    }
  }

  return null
}

function getWinningColumn(board: Disc[], disc: Exclude<Disc, null>): number | null {
  for (let column = 0; column < COLUMNS; column += 1) {
    const simulatedDrop = simulateDrop(board, column, disc)
    if (!simulatedDrop) {
      continue
    }

    if (getWinner(simulatedDrop.nextBoard) === disc) {
      return column
    }
  }

  return null
}

function getNormalAiColumn(board: Disc[]): number | null {
  const winningColumn = getWinningColumn(board, 'Y')
  if (winningColumn !== null) {
    return winningColumn
  }

  const blockingColumn = getWinningColumn(board, 'R')
  if (blockingColumn !== null) {
    return blockingColumn
  }

  const preferredColumn = getAvailableColumns(board)[0]
  return typeof preferredColumn === 'number' ? preferredColumn : null
}

function getEasyAiColumn(board: Disc[]): number | null {
  const availableColumns = getAvailableColumns(board)
  if (availableColumns.length === 0) {
    return null
  }

  const randomColumn = availableColumns[Math.floor(Math.random() * availableColumns.length)] ?? null
  if (randomColumn === null) {
    return null
  }

  if (Math.random() < 0.75) {
    return randomColumn
  }

  return getNormalAiColumn(board) ?? randomColumn
}

function scoreWindow(window: Disc[]) {
  let aiCount = 0
  let playerCount = 0
  let emptyCount = 0

  for (const disc of window) {
    if (disc === 'Y') {
      aiCount += 1
    } else if (disc === 'R') {
      playerCount += 1
    } else {
      emptyCount += 1
    }
  }

  if (aiCount === 4) {
    return 100_000
  }

  if (playerCount === 4) {
    return -100_000
  }

  let score = 0

  if (aiCount === 3 && emptyCount === 1) {
    score += 120
  } else if (aiCount === 2 && emptyCount === 2) {
    score += 18
  }

  if (playerCount === 3 && emptyCount === 1) {
    score -= 110
  } else if (playerCount === 2 && emptyCount === 2) {
    score -= 14
  }

  return score
}

function scoreBoard(board: Disc[]) {
  let score = 0
  const centerColumn = Math.floor(COLUMNS / 2)

  for (let row = 0; row < ROWS; row += 1) {
    if (board[getCellIndex(row, centerColumn)] === 'Y') {
      score += 9
    }
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column <= COLUMNS - WIN_LENGTH; column += 1) {
      const window = Array.from({ length: WIN_LENGTH }, (_, step) => board[getCellIndex(row, column + step)])
      score += scoreWindow(window)
    }
  }

  for (let column = 0; column < COLUMNS; column += 1) {
    for (let row = 0; row <= ROWS - WIN_LENGTH; row += 1) {
      const window = Array.from({ length: WIN_LENGTH }, (_, step) => board[getCellIndex(row + step, column)])
      score += scoreWindow(window)
    }
  }

  for (let row = 0; row <= ROWS - WIN_LENGTH; row += 1) {
    for (let column = 0; column <= COLUMNS - WIN_LENGTH; column += 1) {
      const window = Array.from({ length: WIN_LENGTH }, (_, step) =>
        board[getCellIndex(row + step, column + step)],
      )
      score += scoreWindow(window)
    }
  }

  for (let row = 0; row <= ROWS - WIN_LENGTH; row += 1) {
    for (let column = WIN_LENGTH - 1; column < COLUMNS; column += 1) {
      const window = Array.from({ length: WIN_LENGTH }, (_, step) =>
        board[getCellIndex(row + step, column - step)],
      )
      score += scoreWindow(window)
    }
  }

  return score
}

function minimax(
  board: Disc[],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): number {
  const winner = getWinner(board)
  if (winner === 'Y') {
    return 1_000_000 + depth
  }

  if (winner === 'R') {
    return -1_000_000 - depth
  }

  const availableColumns = getAvailableColumns(board)
  if (depth === 0 || availableColumns.length === 0) {
    return scoreBoard(board)
  }

  if (isMaximizing) {
    let value = -Infinity

    for (const column of availableColumns) {
      const simulatedDrop = simulateDrop(board, column, 'Y')
      if (!simulatedDrop) {
        continue
      }

      const score = minimax(simulatedDrop.nextBoard, depth - 1, alpha, beta, false)
      if (score > value) {
        value = score
      }
      if (value > alpha) {
        alpha = value
      }
      if (alpha >= beta) {
        break
      }
    }

    return value
  }

  let value = Infinity

  for (const column of availableColumns) {
    const simulatedDrop = simulateDrop(board, column, 'R')
    if (!simulatedDrop) {
      continue
    }

    const score = minimax(simulatedDrop.nextBoard, depth - 1, alpha, beta, true)
    if (score < value) {
      value = score
    }
    if (value < beta) {
      beta = value
    }
    if (alpha >= beta) {
      break
    }
  }

  return value
}

function getHardAiColumn(board: Disc[]): number | null {
  const availableColumns = getAvailableColumns(board)
  if (availableColumns.length === 0) {
    return null
  }

  const winningColumn = getWinningColumn(board, 'Y')
  if (winningColumn !== null) {
    return winningColumn
  }

  const blockingColumn = getWinningColumn(board, 'R')
  if (blockingColumn !== null) {
    return blockingColumn
  }

  let bestScore = -Infinity
  let bestColumn = availableColumns[0] ?? null

  for (const column of availableColumns) {
    const simulatedDrop = simulateDrop(board, column, 'Y')
    if (!simulatedDrop) {
      continue
    }

    const score = minimax(simulatedDrop.nextBoard, HARD_SEARCH_DEPTH - 1, -Infinity, Infinity, false)
    if (score > bestScore) {
      bestScore = score
      bestColumn = column
    }
  }

  return bestColumn
}

function getAiColumn(board: Disc[], difficulty: AIDifficulty): number | null {
  if (difficulty === 'easy') {
    return getEasyAiColumn(board)
  }

  if (difficulty === 'hard') {
    return getHardAiColumn(board)
  }

  return getNormalAiColumn(board)
}

function ConnectFourDisc({ disc, animate }: { disc: Exclude<Disc, null>; animate: boolean }) {
  const stroke = disc === 'R' ? '#fecdd3' : '#fef3c7'
  const highlight = disc === 'R' ? 'rgba(255, 228, 230, 0.7)' : 'rgba(254, 243, 199, 0.72)'

  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-full w-full ${animate ? 'motion-drop' : ''}`}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="42"
        fill={disc === 'R' ? '#fb7185' : '#fcd34d'}
        stroke={stroke}
        strokeWidth="8"
      />
      <circle cx="38" cy="34" r="8" fill={highlight} />
    </svg>
  )
}

function ConnectFour() {
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal')
  const [board, setBoard] = useState<Disc[]>(() => Array(ROWS * COLUMNS).fill(null))
  const [isRedTurn, setIsRedTurn] = useState(true)
  const [lastDropIndex, setLastDropIndex] = useState<number | null>(null)

  const winner = useMemo(() => getWinner(board), [board])
  const isDraw = board.every((value) => value !== null) && !winner
  const isAiTurn = mode === 'ai' && !isRedTurn && !winner && !isDraw
  const statusText = winner
    ? `Winner: ${winner === 'R' ? 'Red' : 'Yellow'}`
    : isDraw
      ? "It's a draw!"
      : isAiTurn
        ? 'AI is thinking...'
        : `Turn: ${isRedTurn ? 'Red' : mode === 'ai' ? 'Yellow (AI)' : 'Yellow'}`

  useEffect(() => {
    if (!isAiTurn) {
      return
    }

    const aiColumn = getAiColumn(board, difficulty)
    if (aiColumn === null) {
      return
    }

    const timer = window.setTimeout(() => {
      const simulatedDrop = simulateDrop(board, aiColumn, 'Y')
      if (!simulatedDrop) {
        return
      }

      setIsRedTurn(true)
      setBoard(simulatedDrop.nextBoard)
      setLastDropIndex(simulatedDrop.targetIndex)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [board, difficulty, isAiTurn])

  const resetGame = () => {
    setBoard(Array(ROWS * COLUMNS).fill(null))
    setIsRedTurn(true)
    setLastDropIndex(null)
  }

  const handleModeChange = (nextMode: GameMode) => {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    resetGame()
  }

  const isColumnFull = (column: number) => getDropRow(board, column) < 0

  const handleDrop = (column: number) => {
    if (winner || isDraw || isAiTurn || isColumnFull(column)) {
      return
    }

    const simulatedDrop = simulateDrop(board, column, isRedTurn ? 'R' : 'Y')
    if (!simulatedDrop) {
      return
    }

    setBoard(simulatedDrop.nextBoard)
    setLastDropIndex(simulatedDrop.targetIndex)
    setIsRedTurn((value) => !value)
  }

  const handleReset = () => {
    resetGame()
  }

  const boardInstructionsId = 'connect-four-board-instructions'

  return (
    <GameShell status={statusText} onReset={handleReset}>
      <GameModeToggle mode={mode} onModeChange={handleModeChange} />
      {mode === 'ai' && (
        <GameDifficultyToggle difficulty={difficulty} onDifficultyChange={setDifficulty} />
      )}
      <p id={boardInstructionsId} className="sr-only">
        Select any slot in a column to drop your disc into the lowest available row of that column.
      </p>
      <div
        className="touch-manipulation grid grid-cols-7 gap-2 rounded-xl border border-slate-700/70 bg-indigo-950/50 p-3"
        role="grid"
        aria-label="Connect Four board"
        aria-describedby={boardInstructionsId}
      >
        {board.map((disc, index) => {
          const column = index % COLUMNS
          const row = Math.floor(index / COLUMNS)
          const columnFull = isColumnFull(column)
          const isDisabled = Boolean(winner) || isDraw || columnFull || isAiTurn
          const occupancyLabel =
            disc === 'R' ? 'occupied by Red' : disc === 'Y' ? 'occupied by Yellow' : 'empty'

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDrop(column)}
              disabled={isDisabled}
              aria-label={`Column ${column + 1}, row ${row + 1}, ${occupancyLabel}. ${
                columnFull ? 'Column is full.' : `Drop disc in column ${column + 1}.`
              }`}
              aria-describedby={boardInstructionsId}
              className="motion-control-press touch-manipulation aspect-square rounded-full border border-slate-800 bg-slate-700/80 p-1 transition hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/40 disabled:opacity-70"
            >
              {disc && <ConnectFourDisc disc={disc} animate={index === lastDropIndex} />}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}

export default ConnectFour

