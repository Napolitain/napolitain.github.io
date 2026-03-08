/** @jsxImportSource react */
import { useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'
import GameModeToggle, { type GameMode } from './GameModeToggle'

type ShotResult = 'hit' | 'miss'
type Turn = 'player' | 'cpu'
type Winner = Turn | null
type ShotMap = Partial<Record<number, ShotResult>>

type ShipState = {
  id: string
  size: number
  cells: number[]
  hits: number
}

type BattleState = {
  playerWins: number
  playerShips: ShipState[]
  cpuShips: ShipState[]
  playerShots: ShotMap
  cpuShots: ShotMap
  turn: Turn
  winner: Winner
  lastEvent: string
}

type AttackOutcome = {
  nextShips: ShipState[]
  nextShots: ShotMap
  result: ShotResult
  sunkShipSize: number | null
  allShipsSunk: boolean
}

const GRID_SIZE = 6
const CELL_COUNT = GRID_SIZE * GRID_SIZE
const SHIP_SIZES = [3, 2, 2] as const
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
const CPU_DELAY_MS = 650

function getCellIndex(row: number, column: number) {
  return row * GRID_SIZE + column
}

function formatCell(index: number) {
  const row = Math.floor(index / GRID_SIZE)
  const column = (index % GRID_SIZE) + 1
  return `${ROW_LABELS[row]}${column}`
}

function createShipCells(size: number, row: number, column: number, horizontal: boolean) {
  return Array.from({ length: size }, (_, offset) =>
    getCellIndex(row + (horizontal ? 0 : offset), column + (horizontal ? offset : 0)),
  )
}

function createRandomFleet() {
  while (true) {
    const occupied = new Set<number>()
    const ships: ShipState[] = []
    let failedPlacement = false

    for (let shipIndex = 0; shipIndex < SHIP_SIZES.length; shipIndex += 1) {
      const shipSize = SHIP_SIZES[shipIndex]
      let placed = false

      for (let attempt = 0; attempt < 80; attempt += 1) {
        const horizontal = Math.random() < 0.5
        const maxRow = horizontal ? GRID_SIZE - 1 : GRID_SIZE - shipSize
        const maxColumn = horizontal ? GRID_SIZE - shipSize : GRID_SIZE - 1
        const row = Math.floor(Math.random() * (maxRow + 1))
        const column = Math.floor(Math.random() * (maxColumn + 1))
        const cells = createShipCells(shipSize, row, column, horizontal)

        if (cells.some((cell) => occupied.has(cell))) {
          continue
        }

        cells.forEach((cell) => occupied.add(cell))
        ships.push({
          id: `ship-${shipIndex + 1}`,
          size: shipSize,
          cells,
          hits: 0,
        })
        placed = true
        break
      }

      if (!placed) {
        failedPlacement = true
        break
      }
    }

    if (!failedPlacement) {
      return ships
    }
  }
}

function applyAttack(targetShips: ShipState[], existingShots: ShotMap, targetCell: number): AttackOutcome {
  const shipIndex = targetShips.findIndex((ship) => ship.cells.includes(targetCell))
  const result: ShotResult = shipIndex >= 0 ? 'hit' : 'miss'
  const nextShots: ShotMap = {
    ...existingShots,
    [targetCell]: result,
  }

  if (result === 'miss') {
    return {
      nextShips: targetShips,
      nextShots,
      result,
      sunkShipSize: null,
      allShipsSunk: false,
    }
  }

  const nextShips = targetShips.map((ship, index) =>
    index === shipIndex ? { ...ship, hits: ship.hits + 1 } : ship,
  )
  const updatedShip = nextShips[shipIndex]
  const sunkShipSize = updatedShip.hits >= updatedShip.size ? updatedShip.size : null
  const allShipsSunk = nextShips.every((ship) => ship.hits >= ship.size)

  return {
    nextShips,
    nextShots,
    result,
    sunkShipSize,
    allShipsSunk,
  }
}

function getRandomUntargetedCell(shots: ShotMap) {
  const available: number[] = []

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (!shots[index]) {
      available.push(index)
    }
  }

  if (available.length === 0) {
    return null
  }

  return available[Math.floor(Math.random() * available.length)]
}

function getUntargetedCells(shots: ShotMap) {
  const cells: number[] = []

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (!shots[index]) {
      cells.push(index)
    }
  }

  return cells
}

function getOrthogonalNeighbors(index: number) {
  const row = Math.floor(index / GRID_SIZE)
  const column = index % GRID_SIZE
  const neighbors: number[] = []

  if (row > 0) {
    neighbors.push(getCellIndex(row - 1, column))
  }
  if (row < GRID_SIZE - 1) {
    neighbors.push(getCellIndex(row + 1, column))
  }
  if (column > 0) {
    neighbors.push(getCellIndex(row, column - 1))
  }
  if (column < GRID_SIZE - 1) {
    neighbors.push(getCellIndex(row, column + 1))
  }

  return neighbors
}

function getTargetNeighbors(shots: ShotMap, hitCells: number[]) {
  const candidates = new Set<number>()

  hitCells.forEach((cell) => {
    getOrthogonalNeighbors(cell).forEach((neighbor) => {
      if (!shots[neighbor]) {
        candidates.add(neighbor)
      }
    })
  })

  return [...candidates]
}

function getHardFocusTargets(shots: ShotMap, hitCells: number[]) {
  const focused = new Set<number>()
  const rowGroups = new Map<number, number[]>()
  const columnGroups = new Map<number, number[]>()

  hitCells.forEach((cell) => {
    const row = Math.floor(cell / GRID_SIZE)
    const column = cell % GRID_SIZE
    const rowValues = rowGroups.get(row)
    const columnValues = columnGroups.get(column)

    if (rowValues) {
      rowValues.push(column)
    } else {
      rowGroups.set(row, [column])
    }

    if (columnValues) {
      columnValues.push(row)
    } else {
      columnGroups.set(column, [row])
    }
  })

  rowGroups.forEach((columns, row) => {
    if (columns.length < 2) {
      return
    }

    const ordered = [...columns].sort((a, b) => a - b)
    const left = ordered[0] - 1
    const right = ordered[ordered.length - 1] + 1

    if (left >= 0) {
      const index = getCellIndex(row, left)
      if (!shots[index]) {
        focused.add(index)
      }
    }
    if (right < GRID_SIZE) {
      const index = getCellIndex(row, right)
      if (!shots[index]) {
        focused.add(index)
      }
    }
  })

  columnGroups.forEach((rows, column) => {
    if (rows.length < 2) {
      return
    }

    const ordered = [...rows].sort((a, b) => a - b)
    const top = ordered[0] - 1
    const bottom = ordered[ordered.length - 1] + 1

    if (top >= 0) {
      const index = getCellIndex(top, column)
      if (!shots[index]) {
        focused.add(index)
      }
    }
    if (bottom < GRID_SIZE) {
      const index = getCellIndex(bottom, column)
      if (!shots[index]) {
        focused.add(index)
      }
    }
  })

  return [...focused]
}

function pickCpuTargetCell(shots: ShotMap, targetShips: ShipState[], difficulty: AIDifficulty) {
  if (difficulty === 'easy') {
    return getRandomUntargetedCell(shots)
  }

  const untargetedCells = getUntargetedCells(shots)

  if (untargetedCells.length === 0) {
    return null
  }

  const sunkCells = getSunkCells(targetShips)
  const activeHits: number[] = []

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (shots[index] === 'hit' && !sunkCells.has(index)) {
      activeHits.push(index)
    }
  }

  const targetNeighbors = getTargetNeighbors(shots, activeHits)

  if (difficulty === 'normal') {
    if (targetNeighbors.length > 0) {
      return targetNeighbors[Math.floor(Math.random() * targetNeighbors.length)]
    }

    return untargetedCells[Math.floor(Math.random() * untargetedCells.length)]
  }

  const focusTargets = getHardFocusTargets(shots, activeHits)

  if (focusTargets.length > 0) {
    return focusTargets[Math.floor(Math.random() * focusTargets.length)]
  }

  if (targetNeighbors.length > 0) {
    const rankedNeighbors = [...targetNeighbors].sort((left, right) => {
      const leftOptions = getOrthogonalNeighbors(left).filter((cell) => !shots[cell]).length
      const rightOptions = getOrthogonalNeighbors(right).filter((cell) => !shots[cell]).length
      return rightOptions - leftOptions
    })
    return rankedNeighbors[0]
  }

  const parityTargets = untargetedCells.filter((cell) => {
    const row = Math.floor(cell / GRID_SIZE)
    const column = cell % GRID_SIZE
    return (row + column) % 2 === 0
  })
  const huntTargets = parityTargets.length > 0 ? parityTargets : untargetedCells
  const center = (GRID_SIZE - 1) / 2

  return [...huntTargets].sort((left, right) => {
    const leftRow = Math.floor(left / GRID_SIZE)
    const leftColumn = left % GRID_SIZE
    const rightRow = Math.floor(right / GRID_SIZE)
    const rightColumn = right % GRID_SIZE
    const leftDistance = Math.abs(leftRow - center) + Math.abs(leftColumn - center)
    const rightDistance = Math.abs(rightRow - center) + Math.abs(rightColumn - center)

    return leftDistance - rightDistance
  })[0]
}

function getShipCells(ships: ShipState[]) {
  return new Set(ships.flatMap((ship) => ship.cells))
}

function getSunkCells(ships: ShipState[]) {
  return new Set(
    ships.filter((ship) => ship.hits >= ship.size).flatMap((ship) => ship.cells),
  )
}

function createBattleState(playerWins = 0, mode: GameMode = 'ai'): BattleState {
  return {
    playerWins,
    playerShips: createRandomFleet(),
    cpuShips: createRandomFleet(),
    playerShots: {},
    cpuShots: {},
    turn: 'player',
    winner: null,
    lastEvent:
      mode === 'ai'
        ? 'Target enemy waters to start the battle.'
        : 'Player 1: target Player 2 waters to start the battle.',
  }
}

function CellIcon({
  shot,
  hasShip,
  showShip,
  isSunk,
}: {
  shot?: ShotResult
  hasShip: boolean
  showShip: boolean
  isSunk: boolean
}) {
  const backgroundFill =
    shot === 'hit'
      ? 'rgba(248, 113, 113, 0.22)'
      : shot === 'miss'
        ? 'rgba(56, 189, 248, 0.2)'
        : 'rgba(30, 41, 59, 0.7)'
  const borderColor = shot === 'hit' ? '#fda4af' : shot === 'miss' ? '#67e8f9' : '#334155'

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="92" height="92" rx="20" fill={backgroundFill} stroke={borderColor} strokeWidth="6" />

      {showShip && hasShip && (
        <rect
          x="24"
          y="24"
          width="52"
          height="52"
          rx="14"
          fill="rgba(110, 231, 183, 0.35)"
          stroke="#6ee7b7"
          strokeWidth="5"
        />
      )}

      {shot === 'miss' && <circle cx="50" cy="50" r="11" fill="#67e8f9" />}

      {shot === 'hit' && (
        <>
          <path d="M30 30 70 70" stroke="#fecaca" strokeWidth="10" strokeLinecap="round" />
          <path d="M70 30 30 70" stroke="#fecaca" strokeWidth="10" strokeLinecap="round" />
        </>
      )}

      {isSunk && <circle cx="50" cy="50" r="42" stroke="#facc15" strokeWidth="6" strokeDasharray="8 6" />}
    </svg>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-100">{value}</dd>
    </div>
  )
}

function GridAttack() {
  const [mode, setMode] = useState<GameMode>('ai')
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal')
  const [battleState, setBattleState] = useState<BattleState>(() => createBattleState(0, 'ai'))

  useEffect(() => {
    if (mode !== 'ai' || battleState.turn !== 'cpu' || battleState.winner) {
      return
    }

    const cpuTurnTimer = window.setTimeout(() => {
      setBattleState((currentState) => {
        if (currentState.turn !== 'cpu' || currentState.winner) {
          return currentState
        }

        const targetCell = pickCpuTargetCell(currentState.cpuShots, currentState.playerShips, aiDifficulty)

        if (targetCell === null) {
          return { ...currentState, turn: 'player', lastEvent: 'CPU has no valid targets left.' }
        }

        const outcome = applyAttack(currentState.playerShips, currentState.cpuShots, targetCell)
        const coordinate = formatCell(targetCell)
        let lastEvent =
          outcome.result === 'hit' ? `CPU hit your ship at ${coordinate}.` : `CPU missed at ${coordinate}.`

        if (outcome.sunkShipSize) {
          lastEvent = `CPU sunk your ${outcome.sunkShipSize}-cell ship at ${coordinate}.`
        }

        if (outcome.allShipsSunk) {
          return {
            ...currentState,
            playerShips: outcome.nextShips,
            cpuShots: outcome.nextShots,
            winner: 'cpu',
            lastEvent: 'CPU destroyed your fleet.',
          }
        }

        return {
          ...currentState,
          playerShips: outcome.nextShips,
          cpuShots: outcome.nextShots,
          turn: 'player',
          lastEvent,
        }
      })
    }, CPU_DELAY_MS)

    return () => window.clearTimeout(cpuTurnTimer)
  }, [aiDifficulty, battleState.turn, battleState.winner, mode])

  const playerShipCells = useMemo(() => getShipCells(battleState.playerShips), [battleState.playerShips])
  const playerSunkCells = useMemo(() => getSunkCells(battleState.playerShips), [battleState.playerShips])
  const enemyShipCells = useMemo(() => getShipCells(battleState.cpuShips), [battleState.cpuShips])
  const enemySunkCells = useMemo(() => getSunkCells(battleState.cpuShips), [battleState.cpuShips])

  const playerHits = Object.values(battleState.playerShots).filter((result) => result === 'hit').length
  const playerMisses = Object.values(battleState.playerShots).filter((result) => result === 'miss').length
  const cpuHits = Object.values(battleState.cpuShots).filter((result) => result === 'hit').length
  const cpuMisses = Object.values(battleState.cpuShots).filter((result) => result === 'miss').length
  const playerShipsSunk = battleState.playerShips.filter((ship) => ship.hits >= ship.size).length
  const enemyShipsSunk = battleState.cpuShips.filter((ship) => ship.hits >= ship.size).length

  const canTargetEnemy = battleState.turn === 'player' && !battleState.winner
  const canTargetPlayer = mode === 'local' && battleState.turn === 'cpu' && !battleState.winner
  const revealEnemyShips = Boolean(battleState.winner)
  const enemyBoardInstructionsId = 'grid-attack-enemy-board-instructions'

  const statusText = battleState.winner
    ? battleState.winner === 'player'
      ? mode === 'ai'
        ? `Victory! ${battleState.lastEvent}`
        : `Player 1 wins! ${battleState.lastEvent}`
      : mode === 'ai'
        ? `Defeat. ${battleState.lastEvent}`
        : `Player 2 wins! ${battleState.lastEvent}`
    : battleState.turn === 'player'
      ? mode === 'ai'
        ? `Your turn. ${battleState.lastEvent}`
        : `Player 1 turn. ${battleState.lastEvent}`
      : mode === 'ai'
        ? `CPU turn. ${battleState.lastEvent}`
        : `Player 2 turn. ${battleState.lastEvent}`

  const handleEnemyCellAttack = (cellIndex: number) => {
    setBattleState((currentState) => {
      if (currentState.turn !== 'player' || currentState.winner || currentState.playerShots[cellIndex]) {
        return currentState
      }

      const outcome = applyAttack(currentState.cpuShips, currentState.playerShots, cellIndex)
      const coordinate = formatCell(cellIndex)
      let lastEvent =
        mode === 'ai'
          ? outcome.result === 'hit'
            ? `Direct hit at ${coordinate}.`
            : `Shot missed at ${coordinate}.`
          : outcome.result === 'hit'
            ? `Player 1 hit Player 2 at ${coordinate}.`
            : `Player 1 missed at ${coordinate}.`

      if (outcome.sunkShipSize) {
        lastEvent =
          mode === 'ai'
            ? `You sunk an enemy ${outcome.sunkShipSize}-cell ship at ${coordinate}.`
            : `Player 1 sunk a Player 2 ${outcome.sunkShipSize}-cell ship at ${coordinate}.`
      }

      if (outcome.allShipsSunk) {
        return {
          ...currentState,
          playerWins: currentState.playerWins + 1,
          cpuShips: outcome.nextShips,
          playerShots: outcome.nextShots,
          winner: 'player',
          lastEvent: mode === 'ai' ? 'You destroyed the entire enemy fleet.' : 'Player 1 destroyed Player 2 fleet.',
        }
      }

      return {
        ...currentState,
        cpuShips: outcome.nextShips,
        playerShots: outcome.nextShots,
        turn: 'cpu',
        lastEvent,
      }
    })
  }

  const handlePlayerCellAttack = (cellIndex: number) => {
    setBattleState((currentState) => {
      if (
        mode !== 'local' ||
        currentState.turn !== 'cpu' ||
        currentState.winner ||
        currentState.cpuShots[cellIndex]
      ) {
        return currentState
      }

      const outcome = applyAttack(currentState.playerShips, currentState.cpuShots, cellIndex)
      const coordinate = formatCell(cellIndex)
      let lastEvent = outcome.result === 'hit' ? `Player 2 hit Player 1 at ${coordinate}.` : `Player 2 missed at ${coordinate}.`

      if (outcome.sunkShipSize) {
        lastEvent = `Player 2 sunk a Player 1 ${outcome.sunkShipSize}-cell ship at ${coordinate}.`
      }

      if (outcome.allShipsSunk) {
        return {
          ...currentState,
          playerShips: outcome.nextShips,
          cpuShots: outcome.nextShots,
          winner: 'cpu',
          lastEvent: 'Player 2 destroyed Player 1 fleet.',
        }
      }

      return {
        ...currentState,
        playerShips: outcome.nextShips,
        cpuShots: outcome.nextShots,
        turn: 'player',
        lastEvent,
      }
    })
  }

  const handleReset = () => {
    setBattleState((currentState) => createBattleState(currentState.playerWins, mode))
  }

  const handleModeChange = (nextMode: GameMode) => {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    setBattleState(createBattleState(0, nextMode))
  }

  return (
    <GameShell
      status={statusText}
      onReset={handleReset}
      scoreLabel={mode === 'ai' ? 'Session wins' : 'Player 1 wins'}
      scoreValue={battleState.playerWins}
    >
      <GameModeToggle mode={mode} onModeChange={handleModeChange} />
      {mode === 'ai' && <GameDifficultyToggle difficulty={aiDifficulty} onDifficultyChange={setAiDifficulty} />}

      <p id={enemyBoardInstructionsId} className="sr-only">
        {mode === 'ai'
          ? 'Attack the enemy board by selecting an untried cell. Hits, misses, and sunk ships are shown on the grid.'
          : 'Player 1 attacks the Player 2 board. During Player 2 turns, attack the Player 1 board on the left.'}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/45 p-3">
          <h3 className="text-sm font-semibold text-cyan-200">{mode === 'ai' ? 'Your fleet' : 'Player 1 fleet'}</h3>
          <p className="mt-1 text-xs text-slate-300">
            {mode === 'ai'
              ? 'Green markers are your ships. Red marks are enemy hits.'
              : 'Player 2 attacks this grid during their turn.'}
          </p>
          <div className="mx-auto mt-3 grid w-full max-w-[22rem] grid-cols-6 gap-1.5">
            {Array.from({ length: CELL_COUNT }, (_, index) => {
              const row = Math.floor(index / GRID_SIZE)
              const column = index % GRID_SIZE
              const shot = battleState.cpuShots[index]
              const hasShip = playerShipCells.has(index)
              const isDisabled = !canTargetPlayer || Boolean(shot)
              const shotText = shot === 'hit' ? 'hit' : shot === 'miss' ? 'miss' : 'untargeted'

              return (
                <button
                  key={`player-${index}`}
                  type="button"
                  onClick={() => handlePlayerCellAttack(index)}
                  disabled={isDisabled}
                  aria-label={`Player 1 cell ${ROW_LABELS[row]}${column + 1}, ${shotText}${!shot && canTargetPlayer ? ', ready to fire' : ''}`}
                  className="motion-control-press touch-manipulation aspect-square rounded-lg border border-slate-700 bg-slate-950/70 p-0.5 transition hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  <CellIcon shot={shot} hasShip={hasShip} showShip isSunk={playerSunkCells.has(index)} />
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700/70 bg-slate-900/45 p-3">
          <h3 className="text-sm font-semibold text-rose-200">{mode === 'ai' ? 'Enemy waters' : 'Player 2 fleet'}</h3>
          <p className="mt-1 text-xs text-slate-300">
            {mode === 'ai'
              ? 'Tap or press Enter to fire. Yellow rings mark sunk enemy ships.'
              : 'Player 1 attacks this board. Yellow rings mark sunk ships.'}
          </p>
          <div
            role="grid"
            aria-label={mode === 'ai' ? 'Enemy board' : 'Player 2 board'}
            aria-describedby={enemyBoardInstructionsId}
            className="mx-auto mt-3 grid w-full max-w-[22rem] grid-cols-6 gap-1.5"
          >
            {Array.from({ length: CELL_COUNT }, (_, index) => {
              const row = Math.floor(index / GRID_SIZE)
              const column = index % GRID_SIZE
              const shot = battleState.playerShots[index]
              const hasShip = enemyShipCells.has(index)
              const isDisabled = !canTargetEnemy || Boolean(shot)
              const shotText = shot === 'hit' ? 'hit' : shot === 'miss' ? 'miss' : 'untargeted'

              return (
                <button
                  key={`enemy-${index}`}
                  type="button"
                  onClick={() => handleEnemyCellAttack(index)}
                  disabled={isDisabled}
                  aria-label={`${mode === 'ai' ? 'Enemy' : 'Player 2'} cell ${ROW_LABELS[row]}${column + 1}, ${shotText}${!shot && canTargetEnemy ? ', ready to fire' : ''}`}
                  aria-describedby={enemyBoardInstructionsId}
                  className="motion-control-press touch-manipulation aspect-square rounded-lg border border-slate-700 bg-slate-950/70 p-0.5 transition hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  <CellIcon
                    shot={shot}
                    hasShip={hasShip}
                    showShip={revealEnemyShips}
                    isSunk={enemySunkCells.has(index)}
                  />
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatItem label={`${mode === 'ai' ? 'Your' : 'Player 1'} hits / misses`} value={`${playerHits} / ${playerMisses}`} />
        <StatItem label={`${mode === 'ai' ? 'CPU' : 'Player 2'} hits / misses`} value={`${cpuHits} / ${cpuMisses}`} />
        <StatItem label={`${mode === 'ai' ? 'Enemy' : 'Player 2'} ships sunk`} value={`${enemyShipsSunk} / ${SHIP_SIZES.length}`} />
        <StatItem label={`${mode === 'ai' ? 'Your' : 'Player 1'} ships sunk`} value={`${playerShipsSunk} / ${SHIP_SIZES.length}`} />
        <StatItem label={`${mode === 'ai' ? 'Enemy' : 'Player 2'} cells left`} value={`${CELL_COUNT - Object.keys(battleState.playerShots).length}`} />
        <StatItem label={`${mode === 'ai' ? 'Your' : 'Player 1'} cells untouched`} value={`${CELL_COUNT - Object.keys(battleState.cpuShots).length}`} />
      </dl>
    </GameShell>
  )
}

export default GridAttack

