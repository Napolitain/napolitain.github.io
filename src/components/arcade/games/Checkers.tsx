/** @jsxImportSource react */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import GameModeToggle, { type GameMode } from './GameModeToggle'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'

type PieceColor = 'B' | 'R'
type Piece = {
  color: PieceColor
  king: boolean
}
type Move = {
  from: number
  to: number
  captured: number[]
}
type Winner = PieceColor | 'draw' | null
type LastMove = {
  from: number
  to: number
  captured: number[]
  token: number
}

const BOARD_SIZE = 8
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE
const STARTING_PIECES = 12
const KING_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]
const MOVE_DIRECTIONS: Readonly<Record<PieceColor, ReadonlyArray<readonly [number, number]>>> = {
  B: [
    [1, -1],
    [1, 1],
  ],
  R: [
    [-1, -1],
    [-1, 1],
  ],
}

function getCellIndex(row: number, column: number) {
  return row * BOARD_SIZE + column
}

function getCoordinates(index: number) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
  }
}

function isInsideBoard(row: number, column: number) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE
}

function isPlayableSquare(row: number, column: number) {
  return (row + column) % 2 === 1
}

function getOpponent(player: PieceColor): PieceColor {
  return player === 'B' ? 'R' : 'B'
}

function getPlayerLabel(player: PieceColor) {
  return player === 'B' ? 'Black' : 'Red'
}

function getDirections(piece: Piece) {
  return piece.king ? KING_DIRECTIONS : MOVE_DIRECTIONS[piece.color]
}

function shouldPromote(piece: Piece, destinationRow: number) {
  return !piece.king && ((piece.color === 'B' && destinationRow === BOARD_SIZE - 1) || (piece.color === 'R' && destinationRow === 0))
}

function createInitialBoard() {
  const board: Array<Piece | null> = Array(TOTAL_CELLS).fill(null)

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (isPlayableSquare(row, column)) {
        board[getCellIndex(row, column)] = { color: 'B', king: false }
      }
    }
  }

  for (let row = BOARD_SIZE - 3; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (isPlayableSquare(row, column)) {
        board[getCellIndex(row, column)] = { color: 'R', king: false }
      }
    }
  }

  return board
}

function getCaptureMovesForPiece(board: Array<Piece | null>, index: number): Move[] {
  const piece = board[index]

  if (!piece) {
    return []
  }

  const { row, column } = getCoordinates(index)
  const moves: Move[] = []

  for (const [rowStep, columnStep] of getDirections(piece)) {
    const middleRow = row + rowStep
    const middleColumn = column + columnStep
    const landingRow = row + rowStep * 2
    const landingColumn = column + columnStep * 2

    if (!isInsideBoard(middleRow, middleColumn) || !isInsideBoard(landingRow, landingColumn)) {
      continue
    }

    const middleIndex = getCellIndex(middleRow, middleColumn)
    const landingIndex = getCellIndex(landingRow, landingColumn)
    const middlePiece = board[middleIndex]

    if (middlePiece && middlePiece.color !== piece.color && board[landingIndex] === null) {
      moves.push({
        from: index,
        to: landingIndex,
        captured: [middleIndex],
      })
    }
  }

  return moves
}

function getStepMovesForPiece(board: Array<Piece | null>, index: number): Move[] {
  const piece = board[index]

  if (!piece) {
    return []
  }

  const { row, column } = getCoordinates(index)
  const moves: Move[] = []

  for (const [rowStep, columnStep] of getDirections(piece)) {
    const destinationRow = row + rowStep
    const destinationColumn = column + columnStep

    if (!isInsideBoard(destinationRow, destinationColumn)) {
      continue
    }

    const destinationIndex = getCellIndex(destinationRow, destinationColumn)

    if (board[destinationIndex] === null) {
      moves.push({
        from: index,
        to: destinationIndex,
        captured: [],
      })
    }
  }

  return moves
}

function getLegalMoves(board: Array<Piece | null>, player: PieceColor, forcedFromIndex: number | null): Move[] {
  if (forcedFromIndex !== null) {
    const forcedPiece = board[forcedFromIndex]
    if (!forcedPiece || forcedPiece.color !== player) {
      return []
    }
    return getCaptureMovesForPiece(board, forcedFromIndex)
  }

  const captureMoves: Move[] = []
  const stepMoves: Move[] = []

  for (let index = 0; index < board.length; index += 1) {
    const piece = board[index]

    if (!piece || piece.color !== player) {
      continue
    }

    captureMoves.push(...getCaptureMovesForPiece(board, index))
    stepMoves.push(...getStepMovesForPiece(board, index))
  }

  return captureMoves.length > 0 ? captureMoves : stepMoves
}

function countPieces(board: Array<Piece | null>, player: PieceColor) {
  return board.reduce((total, piece) => (piece?.color === player ? total + 1 : total), 0)
}

function countKings(board: Array<Piece | null>, player: PieceColor) {
  return board.reduce((total, piece) => (piece?.color === player && piece.king ? total + 1 : total), 0)
}

function chooseAiMove(board: Array<Piece | null>, legalMoves: Move[], difficulty: AIDifficulty) {
  if (legalMoves.length === 0) {
    return null
  }

  if (difficulty === 'easy') {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)] ?? null
  }

  let bestMove: { move: Move; score: number } | null = null

  for (const move of legalMoves) {
    const piece = board[move.from]

    if (!piece) {
      continue
    }

    const { row: destinationRow } = getCoordinates(move.to)
    const promotes = shouldPromote(piece, destinationRow)
    let score = move.captured.length * 100 + (promotes ? 20 : 0)

    if (difficulty === 'hard') {
      const nextBoard = [...board]
      nextBoard[move.from] = null
      move.captured.forEach((capturedIndex) => {
        nextBoard[capturedIndex] = null
      })
      nextBoard[move.to] = promotes ? { ...piece, king: true } : piece

      const continuationCaptures = move.captured.length > 0 ? getCaptureMovesForPiece(nextBoard, move.to).length : 0
      const opponentMoves = getLegalMoves(nextBoard, getOpponent(piece.color), null)
      const opponentCaptureMoves = opponentMoves.filter((candidateMove) => candidateMove.captured.length > 0)
      const isExposedToCapture = opponentCaptureMoves.some((candidateMove) => candidateMove.captured.includes(move.to))
      const advancement = piece.king ? 0 : piece.color === 'B' ? destinationRow : BOARD_SIZE - 1 - destinationRow

      score =
        move.captured.length * 140 +
        (promotes ? 70 : 0) +
        continuationCaptures * 45 +
        advancement * 3 -
        opponentMoves.length * 3 -
        opponentCaptureMoves.length * 35 -
        (isExposedToCapture ? 60 : 0)
    }

    if (!bestMove || score > bestMove.score || (score === bestMove.score && move.to < bestMove.move.to)) {
      bestMove = { move, score }
    }
  }

  return bestMove ? bestMove.move : null
}

function CheckersPiece({ piece, animate }: { piece: Piece; animate: boolean }) {
  const isBlack = piece.color === 'B'

  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${animate ? 'motion-drop' : ''}`} fill="none" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="40"
        fill={isBlack ? '#0f172a' : '#e11d48'}
        stroke={isBlack ? '#334155' : '#fecdd3'}
        strokeWidth="8"
      />
      <circle cx="36" cy="34" r="8" fill={isBlack ? 'rgba(148, 163, 184, 0.5)' : 'rgba(255, 241, 242, 0.75)'} />
      {piece.king && (
        <g>
          <path d="M24 62 34 40 50 53 66 40 76 62Z" fill="#facc15" stroke="#fef08a" strokeWidth="4" strokeLinejoin="round" />
          <rect x="24" y="62" width="52" height="11" rx="5" fill="#facc15" stroke="#fef08a" strokeWidth="4" />
        </g>
      )}
    </svg>
  )
}

function Checkers() {
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal')
  const [board, setBoard] = useState<Array<Piece | null>>(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>('B')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [forcedFromIndex, setForcedFromIndex] = useState<number | null>(null)
  const [winner, setWinner] = useState<Winner>(null)
  const [moveCount, setMoveCount] = useState(0)
  const [lastMove, setLastMove] = useState<LastMove | null>(null)

  const legalMoves = useMemo(
    () => (winner ? [] : getLegalMoves(board, currentPlayer, forcedFromIndex)),
    [board, currentPlayer, forcedFromIndex, winner],
  )

  const movablePieces = useMemo(() => new Set(legalMoves.map((move) => move.from)), [legalMoves])

  const movesByFrom = useMemo(() => {
    const groupedMoves = new Map<number, Move[]>()

    legalMoves.forEach((move) => {
      const existing = groupedMoves.get(move.from)
      if (existing) {
        existing.push(move)
      } else {
        groupedMoves.set(move.from, [move])
      }
    })

    return groupedMoves
  }, [legalMoves])

  const moveLookup = useMemo(() => {
    const lookup = new Map<string, Move>()
    legalMoves.forEach((move) => {
      lookup.set(`${move.from}-${move.to}`, move)
    })
    return lookup
  }, [legalMoves])

  const selectedFromIndex = forcedFromIndex ?? selectedIndex
  const selectedMoves = useMemo(
    () => (selectedFromIndex === null ? [] : (movesByFrom.get(selectedFromIndex) ?? [])),
    [movesByFrom, selectedFromIndex],
  )
  const destinationLookup = useMemo(() => new Set(selectedMoves.map((move) => move.to)), [selectedMoves])
  const capturedLookup = useMemo(() => new Set(lastMove?.captured ?? []), [lastMove])
  const captureRequired = legalMoves.some((move) => move.captured.length > 0)

  const blackPieces = useMemo(() => countPieces(board, 'B'), [board])
  const redPieces = useMemo(() => countPieces(board, 'R'), [board])
  const blackKings = useMemo(() => countKings(board, 'B'), [board])
  const redKings = useMemo(() => countKings(board, 'R'), [board])
  const isAiTurn = mode === 'ai' && !winner && currentPlayer === 'R'
  const redLabel = mode === 'ai' ? 'Red (AI)' : 'Red'

  const statusText = winner
    ? winner === 'draw'
      ? "Game over! It's a draw."
      : `Game over! ${getPlayerLabel(winner)} wins.`
    : isAiTurn
      ? `${redLabel} is thinking (${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}).`
    : forcedFromIndex !== null
      ? `${getPlayerLabel(currentPlayer)} must continue capturing with the selected piece.`
      : captureRequired
        ? `${getPlayerLabel(currentPlayer)} to move. Capture required (${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}).`
        : `${getPlayerLabel(currentPlayer)} to move (${legalMoves.length} legal move${legalMoves.length === 1 ? '' : 's'}).`

  const boardInstructionsId = 'checkers-board-instructions'

  const applyMove = useCallback(
    (move: Move) => {
      const movingPiece = board[move.from]

      if (!movingPiece || movingPiece.color !== currentPlayer || winner) {
        return
      }

      const nextBoard = [...board]
      nextBoard[move.from] = null
      move.captured.forEach((capturedIndex) => {
        nextBoard[capturedIndex] = null
      })

      const { row: destinationRow } = getCoordinates(move.to)
      nextBoard[move.to] = shouldPromote(movingPiece, destinationRow) ? { ...movingPiece, king: true } : movingPiece

      const continuationMoves = move.captured.length > 0 ? getCaptureMovesForPiece(nextBoard, move.to) : []

      setBoard(nextBoard)
      setLastMove((current) => ({
        from: move.from,
        to: move.to,
        captured: move.captured,
        token: (current?.token ?? 0) + 1,
      }))
      setMoveCount((count) => count + 1)

      if (move.captured.length > 0 && continuationMoves.length > 0) {
        setForcedFromIndex(move.to)
        setSelectedIndex(move.to)
        return
      }

      const nextPlayer = getOpponent(currentPlayer)
      const nextPlayerPieces = countPieces(nextBoard, nextPlayer)
      const currentPlayerPieces = countPieces(nextBoard, currentPlayer)
      const nextPlayerMoves = getLegalMoves(nextBoard, nextPlayer, null)

      setForcedFromIndex(null)
      setSelectedIndex(null)

      if (nextPlayerPieces === 0 || nextPlayerMoves.length === 0) {
        setWinner(currentPlayerPieces === 0 ? 'draw' : currentPlayer)
        return
      }

      setCurrentPlayer(nextPlayer)
    },
    [board, currentPlayer, winner],
  )

  const handleCellClick = (index: number) => {
    if (winner || isAiTurn) {
      return
    }

    const { row, column } = getCoordinates(index)

    if (!isPlayableSquare(row, column)) {
      return
    }

    const piece = board[index]
    const activeSelection = forcedFromIndex ?? selectedIndex

    if (piece && piece.color === currentPlayer) {
      if (forcedFromIndex !== null) {
        if (index === forcedFromIndex) {
          setSelectedIndex(index)
        }
        return
      }

      if (movablePieces.has(index)) {
        setSelectedIndex((current) => (current === index ? null : index))
      }
      return
    }

    if (activeSelection === null) {
      return
    }

    const move = moveLookup.get(`${activeSelection}-${index}`)

    if (move) {
      applyMove(move)
    }
  }

  useEffect(() => {
    if (!isAiTurn || legalMoves.length === 0) {
      return
    }

    const timeout = setTimeout(() => {
      const aiMove = chooseAiMove(board, legalMoves, difficulty)

      if (aiMove) {
        applyMove(aiMove)
      }
    }, 280)

    return () => clearTimeout(timeout)
  }, [applyMove, board, difficulty, isAiTurn, legalMoves])

  const resetGame = () => {
    setBoard(createInitialBoard())
    setCurrentPlayer('B')
    setSelectedIndex(null)
    setForcedFromIndex(null)
    setWinner(null)
    setMoveCount(0)
    setLastMove(null)
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
    <GameShell status={statusText} onReset={handleReset} scoreLabel="Moves" scoreValue={moveCount}>
      <GameModeToggle mode={mode} onModeChange={handleModeChange} />
      {mode === 'ai' && <GameDifficultyToggle difficulty={difficulty} onDifficultyChange={setDifficulty} />}

      <p id={boardInstructionsId} className="sr-only">
        Select one of your movable pieces, then choose a highlighted destination square. Captures are mandatory,
        and multi-captures must continue with the same piece.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm" aria-label="Piece counts">
        <div
          className={`rounded-lg border px-3 py-2 transition ${
            !winner && currentPlayer === 'B'
              ? 'motion-tile-pop border-cyan-300 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
              : 'border-slate-700 bg-slate-800/80'
          }`}
        >
          <p className="font-semibold text-slate-100">Black</p>
          <p className="mt-1 text-xs text-slate-300">Pieces: {blackPieces} · Kings: {blackKings}</p>
          <p className="text-xs text-slate-400">Captured: {STARTING_PIECES - redPieces}</p>
        </div>
        <div
          className={`rounded-lg border px-3 py-2 transition ${
            !winner && currentPlayer === 'R'
              ? 'motion-tile-pop border-cyan-300 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
              : 'border-slate-700 bg-slate-800/80'
          }`}
        >
          <p className="font-semibold text-slate-100">{redLabel}</p>
          <p className="mt-1 text-xs text-slate-300">Pieces: {redPieces} · Kings: {redKings}</p>
          <p className="text-xs text-slate-400">Captured: {STARTING_PIECES - blackPieces}</p>
        </div>
      </div>

      {!winner && (
        <p className="mb-3 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
          {captureRequired
            ? 'Capture-first rule active: only capturing moves are allowed.'
            : 'Tap or click a movable piece, then a highlighted destination square.'}
        </p>
      )}

      <div
        className="touch-manipulation grid grid-cols-8 gap-1 rounded-xl border border-slate-700/70 bg-emerald-950/40 p-2 select-none sm:gap-1.5 sm:p-3"
        role="grid"
        aria-label="Checkers board"
        aria-describedby={boardInstructionsId}
      >
        {board.map((piece, index) => {
          const { row, column } = getCoordinates(index)
          const isDarkSquare = isPlayableSquare(row, column)
          const isSelected = selectedFromIndex === index
          const isMovablePiece = movablePieces.has(index)
          const isDestination = destinationLookup.has(index)
          const isLastFrom = lastMove?.from === index
          const isLastTo = lastMove?.to === index
          const wasCaptured = capturedLookup.has(index)
          const occupant = piece
            ? `${getPlayerLabel(piece.color)}${piece.king ? ' king' : ' piece'}`
            : 'empty square'

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleCellClick(index)}
              disabled={Boolean(winner) || !isDarkSquare || isAiTurn}
              aria-label={`Row ${row + 1}, column ${column + 1}, ${occupant}${isDestination ? ', legal destination' : ''}${isSelected ? ', selected' : ''}`}
              aria-describedby={boardInstructionsId}
              className={`motion-control-press touch-manipulation relative aspect-square rounded-md border p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed ${
                isDarkSquare
                  ? isDestination
                    ? 'border-cyan-300/90 bg-emerald-700/55 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.25)]'
                    : isSelected
                      ? 'border-cyan-200 bg-emerald-700/45'
                      : isLastTo
                        ? 'border-amber-300/70 bg-emerald-800/65'
                        : 'border-emerald-900/70 bg-emerald-900/55 hover:border-cyan-500/60'
                  : 'border-slate-800/30 bg-slate-200/10'
              }`}
            >
              {isLastFrom && (
                <span
                  className="pointer-events-none absolute inset-1 rounded-[0.45rem] border border-amber-300/70"
                  aria-hidden="true"
                />
              )}
              {wasCaptured && (
                <span
                  className="pointer-events-none absolute inset-1 rounded-[0.45rem] border border-rose-300/70"
                  aria-hidden="true"
                />
              )}
              {isSelected && (
                <span
                  className="motion-click-pulse pointer-events-none absolute inset-1 rounded-[0.45rem] border-2 border-cyan-200/90 shadow-[0_0_12px_rgba(103,232,249,0.5)]"
                  aria-hidden="true"
                />
              )}

              <span className="flex h-full w-full items-center justify-center">
                {piece ? (
                  <CheckersPiece piece={piece} animate={Boolean(isLastTo && lastMove?.token)} />
                ) : (
                  isDestination && (
                    <span className="relative flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5" aria-hidden="true">
                      <span className="motion-tile-pop absolute inset-0 rounded-full border border-cyan-100/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.75)]" />
                    </span>
                  )
                )}
              </span>

              {piece && isMovablePiece && !isSelected && !winner && (
                <span
                  className="pointer-events-none absolute right-1 top-1 h-2 w-2 rounded-full bg-cyan-200/85"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}

export default Checkers

