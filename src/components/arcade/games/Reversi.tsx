/** @jsxImportSource react */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import GameModeToggle, { type GameMode } from './GameModeToggle'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'

type Disc = 'B' | 'W' | null
type Player = Exclude<Disc, null>
type DiscAnimation = 'place' | 'flip' | null

const BOARD_SIZE = 8
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

function getCellIndex(row: number, column: number) {
  return row * BOARD_SIZE + column
}

function isInsideBoard(row: number, column: number) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE
}

function getOpponent(player: Player): Player {
  return player === 'B' ? 'W' : 'B'
}

function getPlayerLabel(player: Player) {
  return player === 'B' ? 'Black' : 'White'
}

function createInitialBoard(): Disc[] {
  const board: Disc[] = Array(TOTAL_CELLS).fill(null)
  const middle = BOARD_SIZE / 2

  board[getCellIndex(middle - 1, middle - 1)] = 'W'
  board[getCellIndex(middle - 1, middle)] = 'B'
  board[getCellIndex(middle, middle - 1)] = 'B'
  board[getCellIndex(middle, middle)] = 'W'

  return board
}

function getCapturedDiscs(board: Disc[], row: number, column: number, player: Player): number[] {
  if (board[getCellIndex(row, column)] !== null) {
    return []
  }

  const opponent = getOpponent(player)
  const captured: number[] = []

  for (const [rowStep, columnStep] of DIRECTIONS) {
    const line: number[] = []
    let nextRow = row + rowStep
    let nextColumn = column + columnStep

    while (isInsideBoard(nextRow, nextColumn)) {
      const index = getCellIndex(nextRow, nextColumn)
      const disc = board[index]

      if (disc === opponent) {
        line.push(index)
        nextRow += rowStep
        nextColumn += columnStep
        continue
      }

      if (disc === player && line.length > 0) {
        captured.push(...line)
      }

      break
    }
  }

  return captured
}

function getLegalMoves(board: Disc[], player: Player): number[] {
  const legalMoves: number[] = []

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const index = getCellIndex(row, column)

      if (board[index] !== null) {
        continue
      }

      if (getCapturedDiscs(board, row, column, player).length > 0) {
        legalMoves.push(index)
      }
    }
  }

  return legalMoves
}

function applyMove(board: Disc[], index: number, player: Player) {
  if (board[index] !== null) {
    return null
  }

  const row = Math.floor(index / BOARD_SIZE)
  const column = index % BOARD_SIZE
  const captured = getCapturedDiscs(board, row, column, player)

  if (captured.length === 0) {
    return null
  }

  const nextBoard = [...board]
  nextBoard[index] = player
  captured.forEach((capturedIndex) => {
    nextBoard[capturedIndex] = player
  })

  return { nextBoard, captured }
}

function countDiscs(board: Disc[], player: Player) {
  return board.reduce((total, disc) => (disc === player ? total + 1 : total), 0)
}

const RISKY_CORNER_BY_MOVE = new Map<number, number>([
  [getCellIndex(0, 1), getCellIndex(0, 0)],
  [getCellIndex(1, 0), getCellIndex(0, 0)],
  [getCellIndex(1, 1), getCellIndex(0, 0)],
  [getCellIndex(0, BOARD_SIZE - 2), getCellIndex(0, BOARD_SIZE - 1)],
  [getCellIndex(1, BOARD_SIZE - 2), getCellIndex(0, BOARD_SIZE - 1)],
  [getCellIndex(1, BOARD_SIZE - 1), getCellIndex(0, BOARD_SIZE - 1)],
  [getCellIndex(BOARD_SIZE - 2, 0), getCellIndex(BOARD_SIZE - 1, 0)],
  [getCellIndex(BOARD_SIZE - 2, 1), getCellIndex(BOARD_SIZE - 1, 0)],
  [getCellIndex(BOARD_SIZE - 1, 1), getCellIndex(BOARD_SIZE - 1, 0)],
  [getCellIndex(BOARD_SIZE - 2, BOARD_SIZE - 1), getCellIndex(BOARD_SIZE - 1, BOARD_SIZE - 1)],
  [getCellIndex(BOARD_SIZE - 2, BOARD_SIZE - 2), getCellIndex(BOARD_SIZE - 1, BOARD_SIZE - 1)],
  [getCellIndex(BOARD_SIZE - 1, BOARD_SIZE - 2), getCellIndex(BOARD_SIZE - 1, BOARD_SIZE - 1)],
])

function chooseAiMove(board: Disc[], legalMoves: number[], player: Player, difficulty: AIDifficulty) {
  if (legalMoves.length === 0) {
    return null
  }

  if (difficulty === 'easy') {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)] ?? null
  }

  let bestMove: { index: number; score: number } | null = null

  for (const index of legalMoves) {
    const row = Math.floor(index / BOARD_SIZE)
    const column = index % BOARD_SIZE
    const captures = getCapturedDiscs(board, row, column, player).length
    const isCorner = (row === 0 || row === BOARD_SIZE - 1) && (column === 0 || column === BOARD_SIZE - 1)
    let score = (isCorner ? 1000 : 0) + captures

    if (difficulty === 'hard') {
      const move = applyMove(board, index, player)

      if (!move) {
        continue
      }

      const opponent = getOpponent(player)
      const opponentMobility = getLegalMoves(move.nextBoard, opponent).length
      const playerLead = countDiscs(move.nextBoard, player) - countDiscs(move.nextBoard, opponent)
      const isEdge = row === 0 || row === BOARD_SIZE - 1 || column === 0 || column === BOARD_SIZE - 1
      const riskyCorner = RISKY_CORNER_BY_MOVE.get(index)
      const cornerRiskPenalty = riskyCorner !== undefined && board[riskyCorner] === null ? 80 : 0

      score =
        (isCorner ? 1200 : 0) +
        captures * 8 +
        (isEdge ? 10 : 0) +
        playerLead * 3 -
        opponentMobility * 6 -
        cornerRiskPenalty
    }

    if (!bestMove || score > bestMove.score || (score === bestMove.score && index < bestMove.index)) {
      bestMove = { index, score }
    }
  }

  return bestMove ? bestMove.index : null
}

function ReversiDisc({ disc, animation }: { disc: Player; animation: DiscAnimation }) {
  const isBlack = disc === 'B'
  const animationClass =
    animation === 'place' ? 'motion-drop' : animation === 'flip' ? 'motion-tile-merge' : ''
  const style =
    animation === 'flip'
      ? {
          transition: 'transform 220ms ease',
          transform: 'rotateY(360deg)',
        }
      : undefined

  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${animationClass}`} style={style} fill="none" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="42"
        fill={isBlack ? '#0f172a' : '#e2e8f0'}
        stroke={isBlack ? '#334155' : '#cbd5e1'}
        strokeWidth="8"
      />
      <circle
        cx="35"
        cy="34"
        r="9"
        fill={isBlack ? 'rgba(148, 163, 184, 0.45)' : 'rgba(255, 255, 255, 0.75)'}
      />
    </svg>
  )
}

function Reversi() {
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal')
  const [board, setBoard] = useState<Disc[]>(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>('B')
  const [isGameOver, setIsGameOver] = useState(false)
  const [passMessage, setPassMessage] = useState<string | null>(null)
  const [lastPlacedIndex, setLastPlacedIndex] = useState<number | null>(null)
  const [lastFlippedIndices, setLastFlippedIndices] = useState<number[]>([])
  const [animationCycle, setAnimationCycle] = useState(0)

  const blackCount = useMemo(() => countDiscs(board, 'B'), [board])
  const whiteCount = useMemo(() => countDiscs(board, 'W'), [board])
  const legalMoveIndexes = useMemo(() => getLegalMoves(board, currentPlayer), [board, currentPlayer])
  const legalMoves = useMemo(() => new Set(legalMoveIndexes), [legalMoveIndexes])
  const lastFlippedLookup = useMemo(() => new Set(lastFlippedIndices), [lastFlippedIndices])
  const legalMoveCount = legalMoveIndexes.length

  const winner = useMemo(() => {
    if (!isGameOver || blackCount === whiteCount) {
      return null
    }

    return blackCount > whiteCount ? 'B' : 'W'
  }, [blackCount, whiteCount, isGameOver])

  const isAiTurn = mode === 'ai' && !isGameOver && currentPlayer === 'W'
  const activePlayerLabel = getPlayerLabel(currentPlayer)
  const whiteLabel = mode === 'ai' ? 'White (AI)' : 'White'
  const passPrefix = passMessage ? `Pass: ${passMessage} ` : ''
  const statusText = isGameOver
    ? winner
      ? `Game over! ${getPlayerLabel(winner)} wins.`
      : "Game over! It's a tie."
    : isAiTurn
      ? `${passPrefix}${whiteLabel} is thinking (${legalMoveCount} legal move${legalMoveCount === 1 ? '' : 's'}).`
    : passMessage
      ? `Pass: ${passMessage} ${activePlayerLabel} to move (${legalMoveCount} legal move${legalMoveCount === 1 ? '' : 's'}).`
      : `${activePlayerLabel} to move (${legalMoveCount} legal move${legalMoveCount === 1 ? '' : 's'}).`

  const boardInstructionsId = 'reversi-board-instructions'

  const playMove = useCallback(
    (index: number) => {
      if (isGameOver) {
        return
      }

      const move = applyMove(board, index, currentPlayer)

      if (!move) {
        return
      }

      const opponent = getOpponent(currentPlayer)
      const opponentLegalMoves = getLegalMoves(move.nextBoard, opponent)
      const currentLegalMoves = getLegalMoves(move.nextBoard, currentPlayer)

      setBoard(move.nextBoard)
      setLastPlacedIndex(index)
      setLastFlippedIndices(move.captured)
      setAnimationCycle((value) => value + 1)

      if (opponentLegalMoves.length > 0) {
        setCurrentPlayer(opponent)
        setPassMessage(null)
        setIsGameOver(false)
        return
      }

      if (currentLegalMoves.length > 0) {
        setCurrentPlayer(currentPlayer)
        setPassMessage(`${getPlayerLabel(opponent)} has no legal moves. ${getPlayerLabel(currentPlayer)} plays again.`)
        setIsGameOver(false)
        return
      }

      setPassMessage(null)
      setIsGameOver(true)
    },
    [board, currentPlayer, isGameOver],
  )

  const handleCellClick = (index: number) => {
    if (isAiTurn) {
      return
    }

    playMove(index)
  }

  useEffect(() => {
    if (!isAiTurn || legalMoveIndexes.length === 0) {
      return
    }

    const timeout = setTimeout(() => {
      const aiMove = chooseAiMove(board, legalMoveIndexes, currentPlayer, difficulty)

      if (aiMove !== null) {
        playMove(aiMove)
      }
    }, 280)

    return () => clearTimeout(timeout)
  }, [board, currentPlayer, difficulty, isAiTurn, legalMoveIndexes, playMove])

  const resetGame = () => {
    setBoard(createInitialBoard())
    setCurrentPlayer('B')
    setIsGameOver(false)
    setPassMessage(null)
    setLastPlacedIndex(null)
    setLastFlippedIndices([])
    setAnimationCycle(0)
  }

  const handleReset = () => {
    resetGame()
  }

  const handleModeChange = (nextMode: GameMode) => {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    resetGame()
  }

  return (
    <GameShell status={statusText} onReset={handleReset}>
      <GameModeToggle mode={mode} onModeChange={handleModeChange} />
      {mode === 'ai' && <GameDifficultyToggle difficulty={difficulty} onDifficultyChange={setDifficulty} />}

      <p id={boardInstructionsId} className="sr-only">
        Place discs on highlighted cells to capture lines of your opponent&apos;s discs.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm" aria-label="Scoreboard">
        <div
          className={`rounded-lg border px-3 py-2 transition ${
            !isGameOver && currentPlayer === 'B'
              ? 'motion-tile-pop border-cyan-300 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
              : 'border-slate-700 bg-slate-800/80'
          }`}
          aria-label={`Black has ${blackCount} discs${!isGameOver && currentPlayer === 'B' ? ', active player' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-950 ring-1 ring-slate-500" aria-hidden="true" />
              Black
            </span>
            <span className="font-semibold text-cyan-100">{blackCount}</span>
          </div>
          <p className={`mt-1 text-[0.65rem] uppercase tracking-wide ${!isGameOver && currentPlayer === 'B' ? 'text-cyan-200' : 'text-slate-400'}`}>
            {!isGameOver && currentPlayer === 'B' ? 'To move' : 'Waiting'}
          </p>
        </div>
        <div
          className={`rounded-lg border px-3 py-2 transition ${
            !isGameOver && currentPlayer === 'W'
              ? 'motion-tile-pop border-cyan-300 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
              : 'border-slate-700 bg-slate-800/80'
          }`}
          aria-label={`${whiteLabel} has ${whiteCount} discs${!isGameOver && currentPlayer === 'W' ? ', active player' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-100 ring-1 ring-slate-300" aria-hidden="true" />
              {whiteLabel}
            </span>
            <span className="font-semibold text-cyan-100">{whiteCount}</span>
          </div>
          <p className={`mt-1 text-[0.65rem] uppercase tracking-wide ${!isGameOver && currentPlayer === 'W' ? 'text-cyan-200' : 'text-slate-400'}`}>
            {!isGameOver && currentPlayer === 'W' ? 'To move' : 'Waiting'}
          </p>
        </div>
      </div>

      {passMessage && !isGameOver && (
        <p
          role="status"
          aria-live="polite"
          className="mb-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100"
        >
          Pass turn: {passMessage}
        </p>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center" aria-hidden="true">
            <span className="absolute inset-0 rounded-full border border-cyan-200/80" />
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
          </span>
          Legal move
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-sm border border-amber-300/80" aria-hidden="true" />
          Last move
        </span>
      </div>

      <div
        className="touch-manipulation grid grid-cols-8 gap-1 rounded-xl border border-slate-700/70 bg-emerald-950/40 p-2 select-none sm:gap-1.5 sm:p-3"
        role="grid"
        aria-label="Reversi board"
        aria-describedby={boardInstructionsId}
      >
        {board.map((disc, index) => {
          const row = Math.floor(index / BOARD_SIZE)
          const column = index % BOARD_SIZE
          const isLegalMove = legalMoves.has(index) && !isGameOver
          const isLastPlaced = index === lastPlacedIndex
          const isFlipped = lastFlippedLookup.has(index)
          const animation: DiscAnimation = isLastPlaced ? 'place' : isFlipped ? 'flip' : null
          const occupancyLabel =
            disc === 'B' ? 'occupied by Black' : disc === 'W' ? 'occupied by White' : 'empty'

          return (
            <button
              key={`${index}-${animation ? animationCycle : 'steady'}`}
              type="button"
              onClick={() => handleCellClick(index)}
              disabled={!isLegalMove || isAiTurn}
              title={
                isLegalMove
                  ? `Play at row ${row + 1}, column ${column + 1}`
                  : isLastPlaced
                    ? 'Last played cell'
                    : `${occupancyLabel[0].toUpperCase()}${occupancyLabel.slice(1)}`
              }
              aria-label={`Row ${row + 1}, column ${column + 1}, ${occupancyLabel}${isLastPlaced ? ', last played cell' : ''}${isLegalMove ? `, legal move for ${activePlayerLabel}` : ''}`}
              aria-describedby={boardInstructionsId}
              className={`motion-control-press touch-manipulation relative aspect-square rounded-md border p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed ${
                isLegalMove
                  ? 'border-cyan-300/90 bg-emerald-700/50 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.2)] hover:border-cyan-200 hover:bg-emerald-700/60'
                  : isLastPlaced
                    ? 'border-amber-300/70 bg-emerald-900/60'
                    : 'border-emerald-900/70 bg-emerald-900/45'
              }`}
            >
              {isLastPlaced && (
                <span
                  className="motion-click-pulse pointer-events-none absolute inset-1 rounded-[0.45rem] border-2 border-amber-300/80 shadow-[0_0_10px_rgba(252,211,77,0.45)]"
                  aria-hidden="true"
                />
              )}
              <span className="flex h-full w-full items-center justify-center">
                {disc ? (
                  <ReversiDisc disc={disc} animation={animation} />
                ) : (
                  isLegalMove && (
                    <span className="relative flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5" aria-hidden="true">
                      <span className="motion-tile-pop absolute inset-0 rounded-full border border-cyan-100/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.75)]" />
                    </span>
                  )
                )}
              </span>
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}

export default Reversi

