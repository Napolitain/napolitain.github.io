/** @jsxImportSource react */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import useSwipeGesture from './useSwipeGesture'
import type { SwipeDirection } from './useSwipeGesture'

type DirectionKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'
type Grid = number[]

const GRID_SIZE = 4
const DIRECTION_KEYS: ReadonlyArray<DirectionKey> = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
const DIRECTION_BUTTONS: ReadonlyArray<{ key: DirectionKey; label: string }> = [
  { key: 'ArrowLeft', label: 'Left' },
  { key: 'ArrowRight', label: 'Right' },
  { key: 'ArrowUp', label: 'Up' },
  { key: 'ArrowDown', label: 'Down' },
]
const SWIPE_TO_DIRECTION: Readonly<Record<SwipeDirection, DirectionKey>> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
}

function isDirectionKey(value: string): value is DirectionKey {
  return DIRECTION_KEYS.some((key) => key === value)
}

function getLinePositions(lineIndex: number, direction: DirectionKey): number[] {
  if (direction === 'ArrowLeft') {
    return Array.from({ length: GRID_SIZE }, (_, column) => lineIndex * GRID_SIZE + column)
  }

  if (direction === 'ArrowRight') {
    return Array.from({ length: GRID_SIZE }, (_, column) => lineIndex * GRID_SIZE + (GRID_SIZE - 1 - column))
  }

  if (direction === 'ArrowUp') {
    return Array.from({ length: GRID_SIZE }, (_, row) => row * GRID_SIZE + lineIndex)
  }

  return Array.from({ length: GRID_SIZE }, (_, row) => (GRID_SIZE - 1 - row) * GRID_SIZE + lineIndex)
}

function slideAndMergeLine(line: number[]): {
  line: number[]
  scoreDelta: number
  movedInto: number[]
  mergedInto: number[]
} {
  const compacted = line.reduce<Array<{ value: number; sourceIndex: number }>>((entries, value, index) => {
    if (value !== 0) {
      entries.push({ value, sourceIndex: index })
    }

    return entries
  }, [])
  const merged: number[] = []
  let scoreDelta = 0
  const movedInto: number[] = []
  const mergedInto: number[] = []

  for (let index = 0; index < compacted.length; index += 1) {
    const current = compacted[index]
    const next = compacted[index + 1]
    const destinationIndex = merged.length

    if (next !== undefined && current.value === next.value) {
      const mergedValue = current.value * 2
      merged.push(mergedValue)
      scoreDelta += mergedValue
      mergedInto.push(destinationIndex)
      movedInto.push(destinationIndex)
      index += 1
      continue
    }

    merged.push(current.value)

    if (current.sourceIndex !== destinationIndex) {
      movedInto.push(destinationIndex)
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0)
  }

  return { line: merged, scoreDelta, movedInto, mergedInto }
}

function moveGrid(grid: Grid, direction: DirectionKey): {
  grid: Grid
  moved: boolean
  scoreDelta: number
  movedPositions: number[]
  mergedPositions: number[]
} {
  const nextGrid = [...grid]
  let moved = false
  let scoreDelta = 0
  const movedPositions = new Set<number>()
  const mergedPositions = new Set<number>()

  for (let lineIndex = 0; lineIndex < GRID_SIZE; lineIndex += 1) {
    const positions = getLinePositions(lineIndex, direction)
    const currentLine = positions.map((position) => grid[position])
    const {
      line: mergedLine,
      scoreDelta: lineScore,
      movedInto: lineMovedInto,
      mergedInto: lineMergedInto,
    } = slideAndMergeLine(currentLine)

    scoreDelta += lineScore

    mergedLine.forEach((value, positionIndex) => {
      nextGrid[positions[positionIndex]] = value
    })

    if (!moved && mergedLine.some((value, valueIndex) => value !== currentLine[valueIndex])) {
      moved = true
    }

    lineMovedInto.forEach((positionIndex) => movedPositions.add(positions[positionIndex]))
    lineMergedInto.forEach((positionIndex) => mergedPositions.add(positions[positionIndex]))
  }

  return {
    grid: nextGrid,
    moved,
    scoreDelta,
    movedPositions: [...movedPositions],
    mergedPositions: [...mergedPositions],
  }
}

function addRandomTile(grid: Grid): Grid {
  const emptyPositions = grid.reduce<number[]>((positions, value, index) => {
    if (value === 0) {
      positions.push(index)
    }

    return positions
  }, [])

  if (emptyPositions.length === 0) {
    return grid
  }

  const nextGrid = [...grid]
  const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)]
  nextGrid[randomPosition] = Math.random() < 0.9 ? 2 : 4
  return nextGrid
}

function createInitialGrid(): Grid {
  const firstTile = addRandomTile(Array(GRID_SIZE * GRID_SIZE).fill(0))
  return addRandomTile(firstTile)
}

function hasMoves(grid: Grid): boolean {
  if (grid.some((value) => value === 0)) {
    return true
  }

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let column = 0; column < GRID_SIZE; column += 1) {
      const index = row * GRID_SIZE + column
      const current = grid[index]

      if (column + 1 < GRID_SIZE && grid[index + 1] === current) {
        return true
      }

      if (row + 1 < GRID_SIZE && grid[index + GRID_SIZE] === current) {
        return true
      }
    }
  }

  return false
}

function getTileClasses(value: number) {
  if (value === 0) return 'bg-slate-800/80 text-transparent'
  if (value === 2) return 'bg-slate-700 text-slate-100'
  if (value === 4) return 'bg-slate-600 text-slate-100'
  if (value === 8) return 'bg-amber-500 text-slate-950'
  if (value === 16) return 'bg-orange-500 text-slate-950'
  if (value === 32) return 'bg-orange-600 text-slate-50'
  if (value === 64) return 'bg-rose-500 text-slate-50'
  return 'bg-purple-500 text-slate-50'
}

function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => createInitialGrid())
  const [score, setScore] = useState(0)
  const [spawnedPositions, setSpawnedPositions] = useState<number[]>([])
  const [mergedPositions, setMergedPositions] = useState<number[]>([])
  const [movedPositions, setMovedPositions] = useState<number[]>([])
  const [lastMoveDirection, setLastMoveDirection] = useState<DirectionKey | null>(null)
  const [animationCycle, setAnimationCycle] = useState(0)
  const [clickedTile, setClickedTile] = useState<{ index: number; token: number } | null>(null)
  const canMove = useMemo(() => hasMoves(grid), [grid])
  const statusText = canMove ? 'Use arrow keys, swipes, or direction buttons to move.' : 'Game over!'
  const tileInstructionsId = 'game-2048-tile-instructions'

  const handleMove = useCallback((direction: DirectionKey) => {
    setGrid((currentGrid) => {
      const {
        grid: movedGrid,
        moved,
        scoreDelta,
        movedPositions: nextMovedPositions,
        mergedPositions: nextMergedPositions,
      } = moveGrid(currentGrid, direction)

      if (!moved) {
        return currentGrid
      }

      const nextGrid = addRandomTile(movedGrid)
      const spawnedPosition = nextGrid.findIndex((value, index) => movedGrid[index] === 0 && value !== 0)

      setScore((currentScore) => currentScore + scoreDelta)
      setSpawnedPositions(spawnedPosition >= 0 ? [spawnedPosition] : [])
      setMergedPositions(nextMergedPositions)
      setMovedPositions(nextMovedPositions)
      setLastMoveDirection(direction)
      setAnimationCycle((value) => value + 1)
      return nextGrid
    })
  }, [])

  const handleReset = useCallback(() => {
    setGrid(createInitialGrid())
    setScore(0)
    setSpawnedPositions([])
    setMergedPositions([])
    setMovedPositions([])
    setLastMoveDirection(null)
    setAnimationCycle(0)
    setClickedTile(null)
  }, [])

  const handleTileClick = useCallback((index: number) => {
    setClickedTile((currentTile) => ({
      index,
      token: (currentTile?.token ?? 0) + 1,
    }))
  }, [])

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      handleMove(SWIPE_TO_DIRECTION[direction])
    },
    [handleMove],
  )
  const swipeHandlers = useSwipeGesture({ onSwipe: handleSwipe })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDirectionKey(event.key)) {
        return
      }

      event.preventDefault()
      handleMove(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove])

  return (
    <GameShell status={statusText} scoreValue={score} onReset={handleReset}>
      <p id={tileInstructionsId} className="sr-only">
        Use arrow keys, swipes on the board, or direction buttons to move tiles. Selecting a tile only
        triggers visual click feedback.
      </p>
      <div
        {...swipeHandlers}
        className="touch-none grid grid-cols-4 gap-2 rounded-xl border border-slate-700/70 bg-amber-950/40 p-3"
        role="grid"
        aria-label="2048 board"
        aria-describedby={tileInstructionsId}
      >
        {grid.map((value, index) => {
          const isSpawned = spawnedPositions.includes(index)
          const isMerged = mergedPositions.includes(index)
          const isMoved = movedPositions.includes(index)
          const isClicked = clickedTile?.index === index

          const moveAnimationClass =
            isMoved && !isSpawned && !isMerged
              ? lastMoveDirection === 'ArrowUp' || lastMoveDirection === 'ArrowDown'
                ? 'motion-drop'
                : 'motion-tile-slide-hint'
              : ''
          const tileAnimationClass = isSpawned
            ? 'motion-drop motion-tile-pop'
            : isMerged
              ? 'motion-tile-merge'
              : moveAnimationClass
          const tileValueLabel = value === 0 ? 'Empty tile' : `Tile ${value}`

          return (
            <button
              key={`${index}-${isSpawned || isMerged || isMoved ? animationCycle : 'steady'}-${
                isClicked ? clickedTile.token : 0
              }`}
                type="button"
                onClick={() => handleTileClick(index)}
                className={`motion-control-press touch-manipulation aspect-square select-none rounded-lg text-center text-lg font-bold leading-[3rem] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:leading-[3.5rem] ${getTileClasses(value)} ${tileAnimationClass} ${
                  isClicked ? 'motion-click-pulse' : ''
                }`}
              aria-label={`${tileValueLabel}. Activate for click feedback only.`}
              aria-describedby={tileInstructionsId}
            >
              {value === 0 ? '0' : value}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {DIRECTION_BUTTONS.map((button) => (
          <button
            key={button.key}
            type="button"
              onClick={() => handleMove(button.key)}
              disabled={!canMove}
              aria-label={`Move ${button.label.toLowerCase()}`}
              className="motion-control-press touch-manipulation rounded-lg border border-slate-600 bg-slate-800/80 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/40 disabled:text-slate-500"
            >
              {button.label}
            </button>
        ))}
      </div>
    </GameShell>
  )
}

export default Game2048

