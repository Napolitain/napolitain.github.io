/** @jsxImportSource react */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import useSwipeGesture from './useSwipeGesture'
import type { SwipeDirection } from './useSwipeGesture'

type Direction = 'up' | 'down' | 'left' | 'right'
type Point = {
  x: number
  y: number
}

const GRID_SIZE = 16
const SPEED_MS = 140
const INITIAL_SNAKE: ReadonlyArray<Point> = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
]
const INITIAL_DIRECTION: Direction = 'right'

const DIRECTION_VECTORS: Readonly<Record<Direction, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE_DIRECTION: Readonly<Record<Direction, Direction>> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

const KEY_TO_DIRECTION: Readonly<Partial<Record<string, Direction>>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const DIRECTION_BUTTONS: ReadonlyArray<{
  direction: Direction
  label: string
  positionClassName: string
}> = [
  { direction: 'up', label: 'Up', positionClassName: 'col-start-2 row-start-1' },
  { direction: 'left', label: 'Left', positionClassName: 'col-start-1 row-start-2' },
  { direction: 'down', label: 'Down', positionClassName: 'col-start-2 row-start-2' },
  { direction: 'right', label: 'Right', positionClassName: 'col-start-3 row-start-2' },
]

const DIRECTION_ROTATION_CLASS: Readonly<Record<Direction, string>> = {
  up: '-rotate-90',
  down: 'rotate-90',
  left: 'rotate-180',
  right: 'rotate-0',
}

function pointKey(point: Point) {
  return `${point.x}:${point.y}`
}

function pointsEqual(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y
}

function createFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((segment) => pointKey(segment)))
  const candidates: Point[] = []

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x}:${y}`)) {
        candidates.push({ x, y })
      }
    }
  }

  if (candidates.length === 0) {
    return snake[0]
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}

function ArrowIcon({ direction }: { direction: Direction }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <g className={`${DIRECTION_ROTATION_CLASS[direction]} origin-center`}>
        <path d="M4 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        <path
          d="m13 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

function SnakeHead({ direction }: { direction: Direction }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full motion-snake-step" fill="none" aria-hidden="true">
      <g className={DIRECTION_ROTATION_CLASS[direction]} style={{ transformOrigin: '50% 50%' }}>
        <rect x="3" y="4" width="18" height="16" rx="8" fill="#6ee7b7" />
        <circle cx="14.5" cy="8.5" r="1.2" fill="#0f172a" />
        <circle cx="14.5" cy="15.5" r="1.2" fill="#0f172a" />
        <path
          d="M20 12c0 1-.8 1.8-1.8 1.8H17v-3.6h1.2c1 0 1.8.8 1.8 1.8Z"
          fill="#34d399"
        />
      </g>
    </svg>
  )
}

function SnakeBody() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full motion-snake-step" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="7" fill="#10b981" />
      <circle cx="11" cy="11" r="4.4" fill="#6ee7b7" fillOpacity="0.4" />
    </svg>
  )
}

function SnakeFood() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full motion-drop" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="6" fill="#fb7185" />
      <circle cx="9.4" cy="10.6" r="2.1" fill="#fecdd3" fillOpacity="0.65" />
      <path d="M11.4 7.4c.2-2.2 1.7-3.9 3.9-4.4-.5 2.1-1.9 3.8-3.9 4.4Z" fill="#34d399" />
      <path
        d="M11.8 7.4c.1-1.1.7-2.1 1.5-2.9"
        stroke="#86efac"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(() => [...INITIAL_SNAKE])
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [queuedDirection, setQueuedDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [food, setFood] = useState<Point>(() => createFood([...INITIAL_SNAKE]))
  const [gameOver, setGameOver] = useState(false)

  const score = snake.length - INITIAL_SNAKE.length
  const isVictory = snake.length === GRID_SIZE * GRID_SIZE
  const controlsLocked = gameOver || isVictory
  const statusText = gameOver
    ? 'Game over!'
    : isVictory
      ? 'You win!'
      : 'Use arrow keys, swipes, or buttons to move.'
  const boardInstructionsId = 'snake-board-instructions'

  const queueDirection = useCallback(
    (nextDirection: Direction) => {
      setQueuedDirection((currentQueuedDirection) => {
        if (
          OPPOSITE_DIRECTION[currentQueuedDirection] === nextDirection ||
          OPPOSITE_DIRECTION[direction] === nextDirection
        ) {
          return currentQueuedDirection
        }

        return nextDirection
      })
    },
    [direction],
  )

  const handleReset = useCallback(() => {
    setSnake([...INITIAL_SNAKE])
    setDirection(INITIAL_DIRECTION)
    setQueuedDirection(INITIAL_DIRECTION)
    setFood(createFood([...INITIAL_SNAKE]))
    setGameOver(false)
  }, [])

  const handleSwipe = useCallback(
    (nextDirection: SwipeDirection) => {
      queueDirection(nextDirection)
    },
    [queueDirection],
  )
  const swipeHandlers = useSwipeGesture({ onSwipe: handleSwipe })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const nextDirection = KEY_TO_DIRECTION[event.key]

      if (!nextDirection) {
        return
      }

      event.preventDefault()
      queueDirection(nextDirection)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queueDirection])

  useEffect(() => {
    if (gameOver || isVictory) {
      return
    }

    const timer = window.setTimeout(() => {
      const vector = DIRECTION_VECTORS[queuedDirection]
      const nextHead = { x: snake[0].x + vector.x, y: snake[0].y + vector.y }

      const hitWall =
        nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE
      const willEatFood = pointsEqual(nextHead, food)
      const bodyToCheck = willEatFood ? snake : snake.slice(0, -1)
      const hitBody = bodyToCheck.some((segment) => pointsEqual(segment, nextHead))

      if (hitWall || hitBody) {
        setGameOver(true)
        return
      }

      const nextSnake = [nextHead, ...snake]

      if (willEatFood) {
        setFood(createFood(nextSnake))
      } else {
        nextSnake.pop()
      }

      setDirection(queuedDirection)
      setSnake(nextSnake)
    }, SPEED_MS)

    return () => window.clearTimeout(timer)
  }, [food, gameOver, isVictory, queuedDirection, snake])

  const snakeLookup = useMemo(() => {
    const lookup = new Map<string, number>()

    snake.forEach((segment, index) => {
      lookup.set(pointKey(segment), index)
    })

    return lookup
  }, [snake])

  return (
    <GameShell status={statusText} scoreValue={score} onReset={handleReset}>
      <p id={boardInstructionsId} className="sr-only">
        Use keyboard arrows, board swipes, or direction buttons to control the snake.
      </p>
      <div
        {...swipeHandlers}
        className="touch-none grid gap-1 rounded-xl border border-slate-700/70 bg-slate-900/80 p-2"
        aria-describedby={boardInstructionsId}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
          const x = index % GRID_SIZE
          const y = Math.floor(index / GRID_SIZE)
          const key = `${x}:${y}`
          const snakeIndex = snakeLookup.get(key)
          const isHead = snakeIndex === 0
          const isBody = typeof snakeIndex === 'number' && snakeIndex > 0
          const isFood = food.x === x && food.y === y

          return (
            <div key={key} className="aspect-square rounded-[2px] bg-slate-700/80 p-[1px]" aria-hidden="true">
              {isHead ? <SnakeHead direction={direction} /> : isBody ? <SnakeBody /> : isFood ? <SnakeFood /> : null}
            </div>
          )
        })}
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-[11rem] grid-cols-3 grid-rows-2 gap-2">
        {DIRECTION_BUTTONS.map((button) => {
          const isQueuedDirection = queuedDirection === button.direction
          const isOppositeDirection =
            OPPOSITE_DIRECTION[queuedDirection] === button.direction ||
            OPPOSITE_DIRECTION[direction] === button.direction

          return (
            <button
              key={button.direction}
              type="button"
              onClick={() => queueDirection(button.direction)}
              disabled={controlsLocked || isOppositeDirection}
              data-pressed={isQueuedDirection ? 'true' : 'false'}
              aria-label={`Move ${button.label.toLowerCase()}`}
              aria-pressed={isQueuedDirection}
              className={`${button.positionClassName} motion-control-press touch-manipulation flex flex-col items-center justify-center gap-1 rounded-lg border py-2 text-[0.65rem] font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/40 disabled:text-slate-500 ${
                isQueuedDirection
                  ? 'motion-click-pulse border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-600 bg-slate-800/80 text-slate-100 hover:border-cyan-400'
              }`}
            >
              <ArrowIcon direction={button.direction} />
              <span>{button.label}</span>
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}

export default SnakeGame

