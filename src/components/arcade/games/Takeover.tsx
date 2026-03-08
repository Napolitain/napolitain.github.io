/** @jsxImportSource react */
import { useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'
import GameModeToggle, { type GameMode } from './GameModeToggle'

type Player = 'B' | 'O'
type Cell = Player | null
type MoveKind = 'clone' | 'jump'
type TokenAnimation = 'place' | 'convert' | null

type Move = {
  from: number
  to: number
  kind: MoveKind
}

const BOARD_SIZE = 7
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE
const MOVE_RANGE = 2
const TAKEOVER_AI_DELAY_MS = 550
const ORTHOGONAL_AND_DIAGONAL: ReadonlyArray<readonly [number, number]> = [
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

function getCoordinates(index: number) {
  return {
    row: Math.floor(index / BOARD_SIZE),
    column: index % BOARD_SIZE,
  }
}

function isInsideBoard(row: number, column: number) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE
}

function getOpponent(player: Player): Player {
  return player === 'B' ? 'O' : 'B'
}

function getPlayerLabel(player: Player) {
  return player === 'B' ? 'Blue' : 'Orange'
}

function createInitialBoard(): Cell[] {
  const board: Cell[] = Array(TOTAL_CELLS).fill(null)

  board[getCellIndex(0, 0)] = 'B'
  board[getCellIndex(BOARD_SIZE - 1, BOARD_SIZE - 1)] = 'B'
  board[getCellIndex(0, BOARD_SIZE - 1)] = 'O'
  board[getCellIndex(BOARD_SIZE - 1, 0)] = 'O'

  return board
}

function getMovesFromCell(board: Cell[], from: number, player: Player): Move[] {
  if (board[from] !== player) {
    return []
  }

  const { row, column } = getCoordinates(from)
  const moves: Move[] = []

  for (let rowOffset = -MOVE_RANGE; rowOffset <= MOVE_RANGE; rowOffset += 1) {
    for (let columnOffset = -MOVE_RANGE; columnOffset <= MOVE_RANGE; columnOffset += 1) {
      const distance = Math.max(Math.abs(rowOffset), Math.abs(columnOffset))

      if (distance === 0 || distance > MOVE_RANGE) {
        continue
      }

      const targetRow = row + rowOffset
      const targetColumn = column + columnOffset

      if (!isInsideBoard(targetRow, targetColumn)) {
        continue
      }

      const targetIndex = getCellIndex(targetRow, targetColumn)

      if (board[targetIndex] !== null) {
        continue
      }

      moves.push({
        from,
        to: targetIndex,
        kind: distance === 1 ? 'clone' : 'jump',
      })
    }
  }

  return moves
}

function getLegalMoves(board: Cell[], player: Player): Move[] {
  const legalMoves: Move[] = []

  for (let index = 0; index < TOTAL_CELLS; index += 1) {
    if (board[index] !== player) {
      continue
    }

    legalMoves.push(...getMovesFromCell(board, index, player))
  }

  return legalMoves
}

function applyMove(board: Cell[], move: Move, player: Player) {
  if (board[move.from] !== player || board[move.to] !== null) {
    return null
  }

  const nextBoard = [...board]

  if (move.kind === 'jump') {
    nextBoard[move.from] = null
  }

  nextBoard[move.to] = player

  const opponent = getOpponent(player)
  const converted: number[] = []
  const { row, column } = getCoordinates(move.to)

  for (const [rowOffset, columnOffset] of ORTHOGONAL_AND_DIAGONAL) {
    const targetRow = row + rowOffset
    const targetColumn = column + columnOffset

    if (!isInsideBoard(targetRow, targetColumn)) {
      continue
    }

    const adjacentIndex = getCellIndex(targetRow, targetColumn)

    if (nextBoard[adjacentIndex] === opponent) {
      nextBoard[adjacentIndex] = player
      converted.push(adjacentIndex)
    }
  }

  return { nextBoard, converted }
}

function countPieces(board: Cell[], player: Player) {
  return board.reduce((total, cell) => (cell === player ? total + 1 : total), 0)
}

function resolveTurn(board: Cell[], candidatePlayer: Player) {
  if (board.every((cell) => cell !== null)) {
    return {
      nextPlayer: candidatePlayer,
      passMessage: null as string | null,
      isGameOver: true,
    }
  }

  const candidateMoves = getLegalMoves(board, candidatePlayer)

  if (candidateMoves.length > 0) {
    return {
      nextPlayer: candidatePlayer,
      passMessage: null as string | null,
      isGameOver: false,
    }
  }

  const otherPlayer = getOpponent(candidatePlayer)
  const otherMoves = getLegalMoves(board, otherPlayer)

  if (otherMoves.length > 0) {
    return {
      nextPlayer: otherPlayer,
      passMessage: `${getPlayerLabel(candidatePlayer)} has no legal moves. ${getPlayerLabel(otherPlayer)} plays.`,
      isGameOver: false,
    }
  }

  return {
    nextPlayer: candidatePlayer,
    passMessage: 'Neither player can make a legal move.',
    isGameOver: true,
  }
}

function scoreTakeoverMove(board: Cell[], move: Move, player: Player) {
  const appliedMove = applyMove(board, move, player)

  if (!appliedMove) {
    return null
  }

  const opponent = getOpponent(player)
  const conversionScore = appliedMove.converted.length * 4
  const cloneBonus = move.kind === 'clone' ? 2 : 0
  const boardControlScore = countPieces(appliedMove.nextBoard, player) - countPieces(appliedMove.nextBoard, opponent)

  return {
    score: conversionScore + cloneBonus + boardControlScore * 0.1,
    nextBoard: appliedMove.nextBoard,
  }
}

function pickTakeoverAiMove(board: Cell[], legalMoves: Move[], player: Player, difficulty: AIDifficulty) {
  const scoredMoves = legalMoves
    .map((move) => {
      const evaluation = scoreTakeoverMove(board, move, player)

      if (!evaluation) {
        return null
      }

      return {
        move,
        score: evaluation.score,
        nextBoard: evaluation.nextBoard,
      }
    })
    .filter(
      (
        value,
      ): value is {
        move: Move
        score: number
        nextBoard: Cell[]
      } => value !== null,
    )

  if (scoredMoves.length === 0) {
    return legalMoves[0] ?? null
  }

  if (difficulty === 'easy') {
    const weakestFirst = [...scoredMoves].sort((a, b) => a.score - b.score)
    const weakerHalf = weakestFirst.slice(0, Math.max(1, Math.ceil(weakestFirst.length / 2)))
    return weakerHalf[Math.floor(Math.random() * weakerHalf.length)].move
  }

  if (difficulty === 'hard') {
    let bestMove: Move | null = null
    let bestHardScore = Number.NEGATIVE_INFINITY
    let bestBaselineScore = Number.NEGATIVE_INFINITY

    scoredMoves.forEach(({ move, score, nextBoard }) => {
      const opponent = getOpponent(player)
      const opponentMoves = getLegalMoves(nextBoard, opponent)
      const ownMobility = getLegalMoves(nextBoard, player).length
      const opponentMobility = opponentMoves.length
      let opponentBestReply = 0

      opponentMoves.forEach((replyMove) => {
        const replyEvaluation = scoreTakeoverMove(nextBoard, replyMove, opponent)
        if (replyEvaluation && replyEvaluation.score > opponentBestReply) {
          opponentBestReply = replyEvaluation.score
        }
      })

      const turnState = resolveTurn(nextBoard, opponent)
      let terminalBonus = 0

      if (turnState.isGameOver) {
        const playerCount = countPieces(nextBoard, player)
        const opponentCount = countPieces(nextBoard, opponent)
        terminalBonus = playerCount > opponentCount ? 500 : playerCount < opponentCount ? -500 : 0
      }

      const hardScore =
        score * 1.4 +
        (ownMobility - opponentMobility) * 0.35 -
        opponentBestReply * 0.9 +
        (opponentMoves.length === 0 ? 8 : 0) +
        terminalBonus

      if (
        hardScore > bestHardScore ||
        (hardScore === bestHardScore && score > bestBaselineScore)
      ) {
        bestHardScore = hardScore
        bestBaselineScore = score
        bestMove = move
      }
    })

    return bestMove ?? scoredMoves[0].move
  }

  let bestMove: Move | null = null
  let bestScore = Number.NEGATIVE_INFINITY

  scoredMoves.forEach(({ move, score }) => {
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  })

  return bestMove ?? legalMoves[0] ?? null
}

function TakeoverToken({ player, animation }: { player: Player; animation: TokenAnimation }) {
  const isBlue = player === 'B'
  const animationClass = animation === 'place' ? 'motion-drop' : animation === 'convert' ? 'motion-tile-merge' : ''
  const fill = isBlue ? '#38bdf8' : '#fb923c'
  const stroke = isBlue ? '#bae6fd' : '#fed7aa'
  const glow = isBlue ? 'rgba(186, 230, 253, 0.7)' : 'rgba(255, 237, 213, 0.7)'

  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${animationClass}`} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id={`takeover-token-${player}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={glow} />
          <stop offset="100%" stopColor={fill} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="41" fill={`url(#takeover-token-${player})`} stroke={stroke} strokeWidth="8" />
      <circle cx="35" cy="33" r="9" fill="rgba(255,255,255,0.38)" />
    </svg>
  )
}

function Takeover() {
  const [mode, setMode] = useState<GameMode>('local')
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal')
  const [board, setBoard] = useState<Cell[]>(() => createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>('B')
  const [selectedSource, setSelectedSource] = useState<number | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [passMessage, setPassMessage] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [lastConvertedIndices, setLastConvertedIndices] = useState<number[]>([])
  const [animationCycle, setAnimationCycle] = useState(0)
  const isAiTurn = mode === 'ai' && currentPlayer === 'O' && !isGameOver

  const blueCount = useMemo(() => countPieces(board, 'B'), [board])
  const orangeCount = useMemo(() => countPieces(board, 'O'), [board])
  const legalMoves = useMemo(() => (isGameOver ? [] : getLegalMoves(board, currentPlayer)), [board, currentPlayer, isGameOver])
  const legalMoveCount = legalMoves.length
  const convertedLookup = useMemo(() => new Set(lastConvertedIndices), [lastConvertedIndices])

  const movesBySource = useMemo(() => {
    const map = new Map<number, Move[]>()

    legalMoves.forEach((move) => {
      const existing = map.get(move.from)

      if (existing) {
        existing.push(move)
        return
      }

      map.set(move.from, [move])
    })

    return map
  }, [legalMoves])

  const selectableSources = useMemo(() => new Set(movesBySource.keys()), [movesBySource])
  const selectedMoves = useMemo(
    () => (selectedSource === null ? [] : movesBySource.get(selectedSource) ?? []),
    [movesBySource, selectedSource],
  )
  const selectedTargets = useMemo(() => {
    const map = new Map<number, MoveKind>()
    selectedMoves.forEach((move) => map.set(move.to, move.kind))
    return map
  }, [selectedMoves])

  const activePlayerLabel = getPlayerLabel(currentPlayer)
  const winner = useMemo(() => {
    if (!isGameOver || blueCount === orangeCount) {
      return null
    }

    return blueCount > orangeCount ? 'B' : 'O'
  }, [blueCount, orangeCount, isGameOver])

  const statusText = isGameOver
    ? winner
      ? `Game over! ${getPlayerLabel(winner)} wins ${blueCount}-${orangeCount}.`
      : `Game over! Draw at ${blueCount}-${orangeCount}.`
    : passMessage
      ? `Pass: ${passMessage} ${activePlayerLabel} to move (${legalMoveCount} legal move${legalMoveCount === 1 ? '' : 's'}).`
      : `${activePlayerLabel} to move (${legalMoveCount} legal move${legalMoveCount === 1 ? '' : 's'}).`

  const selectionHint = selectedSource === null
    ? isAiTurn
      ? 'AI (Orange) is selecting a move...'
      : `${activePlayerLabel}: select a highlighted piece to move.`
    : `Selected row ${getCoordinates(selectedSource).row + 1}, column ${getCoordinates(selectedSource).column + 1}. Choose a highlighted destination.`

  const boardInstructionsId = 'takeover-board-instructions'

  const handleCellClick = (index: number) => {
    if (isGameOver || isAiTurn) {
      return
    }

    const cell = board[index]

    if (selectedSource === null) {
      if (cell === currentPlayer && selectableSources.has(index)) {
        setSelectedSource(index)
      }

      return
    }

    if (index === selectedSource) {
      setSelectedSource(null)
      return
    }

    if (cell === currentPlayer && selectableSources.has(index)) {
      setSelectedSource(index)
      return
    }

    const moveKind = selectedTargets.get(index)

    if (!moveKind) {
      return
    }

    const move: Move = {
      from: selectedSource,
      to: index,
      kind: moveKind,
    }

    const result = applyMove(board, move, currentPlayer)

    if (!result) {
      return
    }

    const nextTurn = resolveTurn(result.nextBoard, getOpponent(currentPlayer))
    setBoard(result.nextBoard)
    setCurrentPlayer(nextTurn.nextPlayer)
    setIsGameOver(nextTurn.isGameOver)
    setPassMessage(nextTurn.passMessage)
    setSelectedSource(null)
    setLastMove(move)
    setLastConvertedIndices(result.converted)
    setAnimationCycle((value) => value + 1)
  }

  useEffect(() => {
    if (!isAiTurn) {
      return
    }

    const aiMove = pickTakeoverAiMove(board, legalMoves, 'O', aiDifficulty)

    if (!aiMove) {
      return
    }

    const aiTimer = window.setTimeout(() => {
      const result = applyMove(board, aiMove, 'O')

      if (!result) {
        return
      }

      const nextTurn = resolveTurn(result.nextBoard, 'B')
      setBoard(result.nextBoard)
      setCurrentPlayer(nextTurn.nextPlayer)
      setIsGameOver(nextTurn.isGameOver)
      setPassMessage(nextTurn.passMessage)
      setSelectedSource(null)
      setLastMove(aiMove)
      setLastConvertedIndices(result.converted)
      setAnimationCycle((value) => value + 1)
    }, TAKEOVER_AI_DELAY_MS)

    return () => window.clearTimeout(aiTimer)
  }, [aiDifficulty, board, isAiTurn, legalMoves])

  const resetGame = () => {
    setBoard(createInitialBoard())
    setCurrentPlayer('B')
    setSelectedSource(null)
    setIsGameOver(false)
    setPassMessage(null)
    setLastMove(null)
    setLastConvertedIndices([])
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
      {mode === 'ai' && <GameDifficultyToggle difficulty={aiDifficulty} onDifficultyChange={setAiDifficulty} />}

      <p id={boardInstructionsId} className="sr-only">
        Select one of your highlighted tokens, then select a highlighted empty cell within one or two squares to clone or jump.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm" aria-label="Scoreboard">
        <div
          className={`rounded-lg border px-3 py-2 transition ${
            !isGameOver && currentPlayer === 'B'
              ? 'motion-tile-pop border-cyan-300 bg-cyan-500/15 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
              : 'border-slate-700 bg-slate-800/80'
          }`}
          aria-label={`Blue controls ${blueCount} cells${!isGameOver && currentPlayer === 'B' ? ', active player' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-400 ring-1 ring-sky-100/70" aria-hidden="true" />
              Blue
            </span>
            <span className="font-semibold text-cyan-100">{blueCount}</span>
          </div>
          <p className={`mt-1 text-[0.65rem] uppercase tracking-wide ${!isGameOver && currentPlayer === 'B' ? 'text-cyan-200' : 'text-slate-400'}`}>
            {!isGameOver && currentPlayer === 'B' ? 'To move' : 'Waiting'}
          </p>
        </div>
        <div
          className={`rounded-lg border px-3 py-2 transition ${
            !isGameOver && currentPlayer === 'O'
              ? 'motion-tile-pop border-orange-300 bg-orange-500/15 shadow-[0_0_0_1px_rgba(251,146,60,0.4)]'
              : 'border-slate-700 bg-slate-800/80'
          }`}
          aria-label={`Orange controls ${orangeCount} cells${!isGameOver && currentPlayer === 'O' ? ', active player' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-400 ring-1 ring-orange-100/70" aria-hidden="true" />
              Orange
            </span>
            <span className="font-semibold text-cyan-100">{orangeCount}</span>
          </div>
          <p className={`mt-1 text-[0.65rem] uppercase tracking-wide ${!isGameOver && currentPlayer === 'O' ? 'text-orange-200' : 'text-slate-400'}`}>
            {!isGameOver && currentPlayer === 'O' ? (mode === 'ai' ? 'AI turn' : 'To move') : 'Waiting'}
          </p>
        </div>
      </div>

      {passMessage && !isGameOver && (
        <p
          role="status"
          aria-live="polite"
          className="mb-3 rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-100"
        >
          {passMessage}
        </p>
      )}

      <p className="mb-2 text-xs text-slate-300">{selectionHint}</p>

      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-cyan-200/80 bg-cyan-500/20" aria-hidden="true" />
          Selectable source
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-emerald-200/80 bg-emerald-500/20" aria-hidden="true" />
          Clone target
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-violet-200/80 bg-violet-500/20" aria-hidden="true" />
          Jump target
        </span>
      </div>

      <div
        className="touch-manipulation grid grid-cols-7 gap-1 rounded-xl border border-slate-700/70 bg-slate-950/60 p-2 select-none sm:gap-1.5 sm:p-3"
        role="grid"
        aria-label="Takeover board"
        aria-describedby={boardInstructionsId}
      >
        {board.map((cell, index) => {
          const { row, column } = getCoordinates(index)
          const isSelectedSource = selectedSource === index
          const isSelectableSource = !isGameOver && !isAiTurn && cell === currentPlayer && selectableSources.has(index)
          const destinationKind = selectedTargets.get(index)
          const isDestination = Boolean(destinationKind)
          const isLastTarget = lastMove?.to === index
          const isConverted = convertedLookup.has(index)
          const tokenAnimation: TokenAnimation = isLastTarget ? 'place' : isConverted ? 'convert' : null
          const cellLabel = cell ? `occupied by ${getPlayerLabel(cell)}` : 'empty'
          const actionLabel = isSelectedSource
            ? 'selected source'
            : isDestination
              ? `${destinationKind} destination`
              : isSelectableSource
                ? 'selectable source'
                : 'not currently playable'

          return (
            <button
              key={`${index}-${tokenAnimation ? animationCycle : 'steady'}`}
              type="button"
              onClick={() => handleCellClick(index)}
              disabled={isGameOver || isAiTurn}
              title={
                isDestination
                  ? `${destinationKind === 'clone' ? 'Clone into' : 'Jump into'} row ${row + 1}, column ${column + 1}`
                  : `${cellLabel[0].toUpperCase()}${cellLabel.slice(1)}`
              }
              aria-label={`Row ${row + 1}, column ${column + 1}, ${cellLabel}, ${actionLabel}`}
              aria-describedby={boardInstructionsId}
              className={`motion-control-press touch-manipulation relative aspect-square rounded-md border p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70 ${
                isSelectedSource
                  ? 'border-cyan-300 bg-cyan-600/25 shadow-[0_0_0_1px_rgba(103,232,249,0.45)]'
                  : isDestination
                    ? destinationKind === 'clone'
                      ? 'border-emerald-300/90 bg-emerald-600/25 shadow-[0_0_0_1px_rgba(110,231,183,0.45)]'
                      : 'border-violet-300/90 bg-violet-600/25 shadow-[0_0_0_1px_rgba(196,181,253,0.45)]'
                    : isSelectableSource
                      ? 'border-cyan-400/70 bg-slate-800/85 hover:border-cyan-300'
                      : isLastTarget
                        ? 'border-amber-300/70 bg-slate-800/80'
                        : 'border-slate-700 bg-slate-900/75 hover:border-slate-500'
              }`}
            >
              {isLastTarget && (
                <span
                  className="motion-click-pulse pointer-events-none absolute inset-1 rounded-[0.45rem] border-2 border-amber-300/80 shadow-[0_0_10px_rgba(252,211,77,0.35)]"
                  aria-hidden="true"
                />
              )}
              <span className="flex h-full w-full items-center justify-center">
                {cell ? (
                  <TakeoverToken player={cell} animation={tokenAnimation} />
                ) : (
                  isDestination && (
                    <span className="relative flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5" aria-hidden="true">
                      <span
                        className={`absolute inset-0 rounded-full border ${
                          destinationKind === 'clone' ? 'border-emerald-200/90' : 'border-violet-200/90'
                        }`}
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          destinationKind === 'clone'
                            ? 'bg-emerald-200 shadow-[0_0_10px_rgba(110,231,183,0.65)]'
                            : 'bg-violet-200 shadow-[0_0_10px_rgba(196,181,253,0.65)]'
                        }`}
                      />
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

export default Takeover

