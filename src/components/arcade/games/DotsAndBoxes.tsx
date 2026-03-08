/** @jsxImportSource react */
import { useCallback, useEffect, useState } from 'react'
import type { KeyboardEvent } from 'react'
import GameShell from './GameShell'
import GameModeToggle, { type GameMode } from './GameModeToggle'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'

type Player = 'A' | 'B'
type EdgeOrientation = 'horizontal' | 'vertical'

type EdgeDefinition = {
  id: string
  orientation: EdgeOrientation
  row: number
  column: number
  x1: number
  y1: number
  x2: number
  y2: number
  adjacentBoxes: string[]
}

type BoxDefinition = {
  id: string
  row: number
  column: number
  x: number
  y: number
  edgeIds: readonly [string, string, string, string]
}

const DOTS_PER_SIDE = 5
const BOXES_PER_SIDE = DOTS_PER_SIDE - 1
const CELL_SIZE = 72
const BOARD_PADDING = 24
const EDGE_STROKE_WIDTH = 8
const EDGE_HIT_STROKE_WIDTH = 28
const DOT_RADIUS = 6
const BOARD_SIZE = BOARD_PADDING * 2 + CELL_SIZE * BOXES_PER_SIDE

const PLAYER_STYLES: Record<Player, { line: string; fill: string }> = {
  A: { line: '#22d3ee', fill: 'rgba(34, 211, 238, 0.28)' },
  B: { line: '#fb7185', fill: 'rgba(251, 113, 133, 0.28)' },
}

function getHorizontalEdgeId(row: number, column: number) {
  return `h-${row}-${column}`
}

function getVerticalEdgeId(row: number, column: number) {
  return `v-${row}-${column}`
}

function getBoxId(row: number, column: number) {
  return `b-${row}-${column}`
}

const EDGE_DEFINITIONS: EdgeDefinition[] = []

for (let row = 0; row < DOTS_PER_SIDE; row += 1) {
  for (let column = 0; column < BOXES_PER_SIDE; column += 1) {
    const adjacentBoxes: string[] = []

    if (row > 0) {
      adjacentBoxes.push(getBoxId(row - 1, column))
    }

    if (row < BOXES_PER_SIDE) {
      adjacentBoxes.push(getBoxId(row, column))
    }

    EDGE_DEFINITIONS.push({
      id: getHorizontalEdgeId(row, column),
      orientation: 'horizontal',
      row,
      column,
      x1: BOARD_PADDING + column * CELL_SIZE,
      y1: BOARD_PADDING + row * CELL_SIZE,
      x2: BOARD_PADDING + (column + 1) * CELL_SIZE,
      y2: BOARD_PADDING + row * CELL_SIZE,
      adjacentBoxes,
    })
  }
}

for (let row = 0; row < BOXES_PER_SIDE; row += 1) {
  for (let column = 0; column < DOTS_PER_SIDE; column += 1) {
    const adjacentBoxes: string[] = []

    if (column > 0) {
      adjacentBoxes.push(getBoxId(row, column - 1))
    }

    if (column < BOXES_PER_SIDE) {
      adjacentBoxes.push(getBoxId(row, column))
    }

    EDGE_DEFINITIONS.push({
      id: getVerticalEdgeId(row, column),
      orientation: 'vertical',
      row,
      column,
      x1: BOARD_PADDING + column * CELL_SIZE,
      y1: BOARD_PADDING + row * CELL_SIZE,
      x2: BOARD_PADDING + column * CELL_SIZE,
      y2: BOARD_PADDING + (row + 1) * CELL_SIZE,
      adjacentBoxes,
    })
  }
}

const BOX_DEFINITIONS: BoxDefinition[] = []

for (let row = 0; row < BOXES_PER_SIDE; row += 1) {
  for (let column = 0; column < BOXES_PER_SIDE; column += 1) {
    BOX_DEFINITIONS.push({
      id: getBoxId(row, column),
      row,
      column,
      x: BOARD_PADDING + column * CELL_SIZE,
      y: BOARD_PADDING + row * CELL_SIZE,
      edgeIds: [
        getHorizontalEdgeId(row, column),
        getHorizontalEdgeId(row + 1, column),
        getVerticalEdgeId(row, column),
        getVerticalEdgeId(row, column + 1),
      ],
    })
  }
}

const BOXES_BY_ID: Record<string, BoxDefinition> = Object.fromEntries(
  BOX_DEFINITIONS.map((box) => [box.id, box]),
)

const DOT_COORDINATES = Array.from({ length: DOTS_PER_SIDE * DOTS_PER_SIDE }, (_, index) => {
  const row = Math.floor(index / DOTS_PER_SIDE)
  const column = index % DOTS_PER_SIDE

  return {
    id: `dot-${row}-${column}`,
    x: BOARD_PADDING + column * CELL_SIZE,
    y: BOARD_PADDING + row * CELL_SIZE,
  }
})

function chooseAiEdge(
  drawnEdges: Partial<Record<string, Player>>,
  claimedBoxes: Partial<Record<string, Player>>,
  difficulty: AIDifficulty,
) {
  const availableEdges = EDGE_DEFINITIONS.filter((edge) => !drawnEdges[edge.id])

  if (availableEdges.length === 0) {
    return null
  }

  if (difficulty === 'easy') {
    return availableEdges[Math.floor(Math.random() * availableEdges.length)] ?? null
  }

  let bestCompletingEdge: { edge: EdgeDefinition; boxes: number } | null = null
  const safeEdges: EdgeDefinition[] = []
  let hardFallbackEdge: { edge: EdgeDefinition; riskCount: number } | null = null

  for (const edge of availableEdges) {
    let completedBoxes = 0
    let riskCount = 0

    for (const boxId of edge.adjacentBoxes) {
      if (claimedBoxes[boxId]) {
        continue
      }

      const box = BOXES_BY_ID[boxId]
      const drawnCount = box.edgeIds.reduce(
        (count, edgeId) => count + (edgeId === edge.id || drawnEdges[edgeId] ? 1 : 0),
        0,
      )

      if (drawnCount === 4) {
        completedBoxes += 1
      } else if (drawnCount === 3) {
        riskCount += 1
      }
    }

    if (completedBoxes > 0) {
      if (
        !bestCompletingEdge ||
        completedBoxes > bestCompletingEdge.boxes ||
        (completedBoxes === bestCompletingEdge.boxes && edge.id < bestCompletingEdge.edge.id)
      ) {
        bestCompletingEdge = { edge, boxes: completedBoxes }
      }
      continue
    }

    if (riskCount === 0) {
      safeEdges.push(edge)
    } else if (
      difficulty === 'hard' &&
      (!hardFallbackEdge ||
        riskCount < hardFallbackEdge.riskCount ||
        (riskCount === hardFallbackEdge.riskCount && edge.id < hardFallbackEdge.edge.id))
    ) {
      hardFallbackEdge = { edge, riskCount }
    }
  }

  if (bestCompletingEdge) {
    return bestCompletingEdge.edge
  }

  if (difficulty === 'hard' && safeEdges.length > 0) {
    let bestSafeEdge: { edge: EdgeDefinition; futureSafeEdges: number } | null = null

    for (const edge of safeEdges) {
      const simulatedDrawnEdges: Partial<Record<string, Player>> = { ...drawnEdges, [edge.id]: 'B' }
      const futureSafeEdges = EDGE_DEFINITIONS.reduce((total, candidateEdge) => {
        if (simulatedDrawnEdges[candidateEdge.id]) {
          return total
        }

        const createsRisk = candidateEdge.adjacentBoxes.some((boxId) => {
          if (claimedBoxes[boxId]) {
            return false
          }

          const box = BOXES_BY_ID[boxId]
          const drawnCount = box.edgeIds.reduce(
            (count, edgeId) => count + (edgeId === candidateEdge.id || simulatedDrawnEdges[edgeId] ? 1 : 0),
            0,
          )

          return drawnCount === 3
        })

        return total + (createsRisk ? 0 : 1)
      }, 0)

      if (
        !bestSafeEdge ||
        futureSafeEdges > bestSafeEdge.futureSafeEdges ||
        (futureSafeEdges === bestSafeEdge.futureSafeEdges && edge.id < bestSafeEdge.edge.id)
      ) {
        bestSafeEdge = { edge, futureSafeEdges }
      }
    }

    if (bestSafeEdge) {
      return bestSafeEdge.edge
    }
  }

  if (difficulty === 'hard' && hardFallbackEdge) {
    return hardFallbackEdge.edge
  }

  const sortedFallback = (safeEdges.length > 0 ? safeEdges : availableEdges).sort((a, b) => a.id.localeCompare(b.id))
  return sortedFallback[0] ?? null
}

function DotsAndBoxes() {
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal')
  const [drawnEdges, setDrawnEdges] = useState<Partial<Record<string, Player>>>({})
  const [claimedBoxes, setClaimedBoxes] = useState<Partial<Record<string, Player>>>({})
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A')
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [lastEdgeId, setLastEdgeId] = useState<string | null>(null)
  const [lastClaimedBoxIds, setLastClaimedBoxIds] = useState<string[]>([])

  const scoreA = Object.values(claimedBoxes).filter((owner) => owner === 'A').length
  const scoreB = Object.values(claimedBoxes).filter((owner) => owner === 'B').length
  const drawnEdgeCount = Object.keys(drawnEdges).length
  const edgesRemaining = EDGE_DEFINITIONS.length - drawnEdgeCount
  const isGameOver = edgesRemaining === 0
  const isAiTurn = mode === 'ai' && !isGameOver && currentPlayer === 'B'
  const playerBLabel = mode === 'ai' ? 'Player B (AI)' : 'Player B'

  let statusText = `Turn: Player ${currentPlayer}. ${edgesRemaining} edge${edgesRemaining === 1 ? '' : 's'} left.`

  if (isGameOver) {
    if (scoreA === scoreB) {
      statusText = `Game over! Tie game at ${scoreA}-${scoreB}.`
    } else {
      const winningPlayer = scoreA > scoreB ? 'A' : 'B'
      const winningScore = Math.max(scoreA, scoreB)
      const losingScore = Math.min(scoreA, scoreB)
      statusText = `Game over! Player ${winningPlayer} wins ${winningScore}-${losingScore}.`
    }
  } else if (isAiTurn) {
    statusText = `${playerBLabel} is thinking. ${edgesRemaining} edge${edgesRemaining === 1 ? '' : 's'} left.`
  }

  const handleEdgeSelect = useCallback(
    (edge: EdgeDefinition, initiatedByAi = false) => {
      if (isGameOver || drawnEdges[edge.id] || (isAiTurn && !initiatedByAi)) {
        return
      }

      const nextDrawnEdges: Partial<Record<string, Player>> = {
        ...drawnEdges,
        [edge.id]: currentPlayer,
      }

      const completedBoxIds = edge.adjacentBoxes.filter((boxId) => {
        if (claimedBoxes[boxId]) {
          return false
        }

        const box = BOXES_BY_ID[boxId]
        return box.edgeIds.every((edgeId) => Boolean(nextDrawnEdges[edgeId]))
      })

      setDrawnEdges(nextDrawnEdges)
      setLastEdgeId(edge.id)
      setHoveredEdgeId(null)

      if (completedBoxIds.length === 0) {
        setCurrentPlayer((player) => (player === 'A' ? 'B' : 'A'))
        setLastClaimedBoxIds([])
        return
      }

      setClaimedBoxes((currentBoxes) => {
        const nextBoxes: Partial<Record<string, Player>> = { ...currentBoxes }

        completedBoxIds.forEach((boxId) => {
          nextBoxes[boxId] = currentPlayer
        })

        return nextBoxes
      })
      setLastClaimedBoxIds(completedBoxIds)
    },
    [claimedBoxes, currentPlayer, drawnEdges, isAiTurn, isGameOver],
  )

  const handleEdgeKeyDown = (event: KeyboardEvent<SVGGElement>, edge: EdgeDefinition) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    handleEdgeSelect(edge)
  }

  useEffect(() => {
    if (!isAiTurn) {
      return
    }

    const timeout = setTimeout(() => {
      const edge = chooseAiEdge(drawnEdges, claimedBoxes, difficulty)

      if (edge) {
        handleEdgeSelect(edge, true)
      }
    }, 260)

    return () => clearTimeout(timeout)
  }, [claimedBoxes, difficulty, drawnEdges, handleEdgeSelect, isAiTurn])

  const resetGame = () => {
    setDrawnEdges({})
    setClaimedBoxes({})
    setCurrentPlayer('A')
    setHoveredEdgeId(null)
    setLastEdgeId(null)
    setLastClaimedBoxIds([])
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

  const instructionsId = 'dots-and-boxes-board-instructions'
  const activePreviewColor = PLAYER_STYLES[currentPlayer].line

  return (
    <GameShell status={statusText} onReset={handleReset}>
      <GameModeToggle mode={mode} onModeChange={handleModeChange} />
      {mode === 'ai' && <GameDifficultyToggle difficulty={difficulty} onDifficultyChange={setDifficulty} />}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            !isGameOver && currentPlayer === 'A'
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
              : 'border-slate-700 bg-slate-800/60 text-slate-200'
          }`}
        >
          <p className="font-semibold">Player A</p>
          <p className="text-xs text-slate-300">Score: {scoreA}</p>
        </div>
        <div
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            !isGameOver && currentPlayer === 'B'
              ? 'border-rose-400 bg-rose-500/20 text-rose-100'
              : 'border-slate-700 bg-slate-800/60 text-slate-200'
          }`}
        >
          <p className="font-semibold">{playerBLabel}</p>
          <p className="text-xs text-slate-300">Score: {scoreB}</p>
        </div>
      </div>

      <p id={instructionsId} className="sr-only">
        Select any open edge to draw it. Completing one or more boxes claims them and gives the same player
        another turn.
      </p>

      <div className="touch-manipulation rounded-xl border border-slate-700/70 bg-indigo-950/50 p-3">
        <svg
          viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
          className="mx-auto block w-full max-w-[28rem]"
          role="img"
          aria-label="Dots and Boxes board"
          aria-describedby={instructionsId}
        >
          {BOX_DEFINITIONS.map((box) => {
            const owner = claimedBoxes[box.id]

            if (!owner) {
              return null
            }

            const isRecentlyClaimed = lastClaimedBoxIds.includes(box.id)

            return (
              <g key={box.id}>
                <rect
                  x={box.x + EDGE_STROKE_WIDTH / 2}
                  y={box.y + EDGE_STROKE_WIDTH / 2}
                  width={CELL_SIZE - EDGE_STROKE_WIDTH}
                  height={CELL_SIZE - EDGE_STROKE_WIDTH}
                  rx={10}
                  fill={PLAYER_STYLES[owner].fill}
                  stroke={PLAYER_STYLES[owner].line}
                  strokeWidth={isRecentlyClaimed ? 3 : 1.5}
                  className={isRecentlyClaimed ? 'motion-drop' : undefined}
                />
                <text
                  x={box.x + CELL_SIZE / 2}
                  y={box.y + CELL_SIZE / 2 + 6}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="700"
                  fill={owner === 'A' ? '#cffafe' : '#ffe4e6'}
                  pointerEvents="none"
                >
                  {owner}
                </text>
              </g>
            )
          })}

          {EDGE_DEFINITIONS.map((edge) => {
            const owner = drawnEdges[edge.id]

            if (owner) {
              const isLastDrawnEdge = edge.id === lastEdgeId

              return (
                <line
                  key={edge.id}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={PLAYER_STYLES[owner].line}
                  strokeWidth={isLastDrawnEdge ? EDGE_STROKE_WIDTH + 1.5 : EDGE_STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={CELL_SIZE}
                  strokeDashoffset={CELL_SIZE}
                >
                  <animate attributeName="stroke-dashoffset" from={CELL_SIZE} to="0" dur="180ms" fill="freeze" />
                </line>
              )
            }

            const isHovered = hoveredEdgeId === edge.id

            return (
              <g
                key={edge.id}
                role="button"
                tabIndex={isGameOver || isAiTurn ? -1 : 0}
                aria-disabled={isGameOver || isAiTurn}
                aria-label={`Draw ${edge.orientation} edge at row ${edge.row + 1}, column ${edge.column + 1}`}
                onClick={() => handleEdgeSelect(edge)}
                onKeyDown={(event) => handleEdgeKeyDown(event, edge)}
                onPointerEnter={() => {
                  if (!isAiTurn) {
                    setHoveredEdgeId(edge.id)
                  }
                }}
                onPointerLeave={() => setHoveredEdgeId((current) => (current === edge.id ? null : current))}
                onFocus={() => {
                  if (!isAiTurn) {
                    setHoveredEdgeId(edge.id)
                  }
                }}
                onBlur={() => setHoveredEdgeId((current) => (current === edge.id ? null : current))}
                className={isGameOver || isAiTurn ? 'cursor-default' : 'cursor-pointer'}
              >
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="transparent"
                  strokeWidth={EDGE_HIT_STROKE_WIDTH}
                  strokeLinecap="round"
                  pointerEvents={isAiTurn ? 'none' : 'stroke'}
                />
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={activePreviewColor}
                  strokeOpacity={isHovered ? 0.92 : 0.28}
                  strokeWidth={isHovered ? EDGE_STROKE_WIDTH : EDGE_STROKE_WIDTH - 2}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              </g>
            )
          })}

          {DOT_COORDINATES.map((dot) => (
            <circle key={dot.id} cx={dot.x} cy={dot.y} r={DOT_RADIUS} fill="#e2e8f0" stroke="#020617" strokeWidth={2} />
          ))}
        </svg>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Tap or click an undrawn edge. Completing one or more boxes keeps your turn.
      </p>
    </GameShell>
  )
}

export default DotsAndBoxes

