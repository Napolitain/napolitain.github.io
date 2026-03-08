/** @jsxImportSource react */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import GameDifficultyToggle, { type AIDifficulty } from './GameDifficultyToggle'
import GameModeToggle, { type GameMode } from './GameModeToggle'

type Player = 'A' | 'B'
type SlotPosition = (typeof SLOT_POSITIONS)[number]

type PlacedWeight = {
  slot: SlotPosition
  weight: number
  player: Player
}

type RoundResult =
  | {
      reason: 'tip'
      winner: Player
      loser: Player
      finalTorque: number
    }
  | {
      reason: 'stable'
      winner: null
      finalTorque: number
    }

const SLOT_POSITIONS = [-4, -3, -2, -1, 1, 2, 3, 4] as const
const INITIAL_WEIGHTS = [1, 2, 3, 4] as const
const SAFE_TORQUE_LIMIT = 14
const BOARD_CENTER_X = 260
const BOARD_CENTER_Y = 118
const SLOT_SPACING = 42
const BALANCE_AI_DELAY_MS = 650

const PLAYER_COLORS: Record<Player, { pieceFill: string; pieceStroke: string; pieceText: string }> = {
  A: { pieceFill: '#22d3ee', pieceStroke: '#0e7490', pieceText: '#083344' },
  B: { pieceFill: '#fb7185', pieceStroke: '#be123c', pieceText: '#4c0519' },
}

function createInitialWeightPool(): Record<Player, number[]> {
  return {
    A: [...INITIAL_WEIGHTS],
    B: [...INITIAL_WEIGHTS],
  }
}

function getOpponent(player: Player): Player {
  return player === 'A' ? 'B' : 'A'
}

function formatTorque(torque: number) {
  return `${torque > 0 ? '+' : ''}${torque}`
}

function computeTorque(placements: PlacedWeight[]) {
  return placements.reduce((total, placement) => total + placement.slot * placement.weight, 0)
}

function getSlotLabel(slot: SlotPosition) {
  const side = slot < 0 ? 'L' : 'R'
  return `${side}${Math.abs(slot)}`
}

function scoreBalanceMove(currentTorque: number, slot: SlotPosition, weight: number) {
  const nextTorque = currentTorque + slot * weight
  const overflow = Math.max(0, Math.abs(nextTorque) - SAFE_TORQUE_LIMIT)
  return {
    score: overflow === 0 ? Math.abs(nextTorque) : 100 + overflow * 20 + Math.abs(nextTorque),
    nextTorque,
  }
}

function pickBalanceAiMove(
  placements: PlacedWeight[],
  availableWeights: number[],
  opponentWeights: number[],
  difficulty: AIDifficulty,
) {
  const occupiedSlots = new Set(placements.map((placement) => placement.slot))
  const currentTorque = computeTorque(placements)
  const candidateMoves: Array<{
    slot: SlotPosition
    weight: number
    score: number
    nextTorque: number
  }> = []

  for (const weight of availableWeights) {
    for (const slot of SLOT_POSITIONS) {
      if (occupiedSlots.has(slot)) {
        continue
      }

      const { score, nextTorque } = scoreBalanceMove(currentTorque, slot, weight)
      candidateMoves.push({ slot, weight, score, nextTorque })
    }
  }

  if (candidateMoves.length === 0) {
    return null
  }

  if (difficulty === 'easy') {
    const sortedByScore = [...candidateMoves].sort((a, b) => a.score - b.score)
    const weakPool = sortedByScore.slice(Math.floor(sortedByScore.length / 2))
    const choices = weakPool.length > 0 ? weakPool : sortedByScore
    const randomMove = choices[Math.floor(Math.random() * choices.length)]

    return {
      slot: randomMove.slot,
      weight: randomMove.weight,
    }
  }

  if (difficulty === 'hard') {
    let bestHardMove:
      | {
          slot: SlotPosition
          weight: number
          score: number
          hardScore: number
        }
      | null = null

    for (const candidate of candidateMoves) {
      const remainingSlots = SLOT_POSITIONS.filter((slot) => !occupiedSlots.has(slot) && slot !== candidate.slot)
      let opponentBestScore = Number.POSITIVE_INFINITY

      for (const weight of opponentWeights) {
        for (const slot of remainingSlots) {
          const { score } = scoreBalanceMove(candidate.nextTorque, slot, weight)
          if (score < opponentBestScore) {
            opponentBestScore = score
          }
        }
      }

      const pressureScore = Number.isFinite(opponentBestScore) ? opponentBestScore : 180
      const hardScore = pressureScore - candidate.score * 1.2

      if (
        !bestHardMove ||
        hardScore > bestHardMove.hardScore ||
        (hardScore === bestHardMove.hardScore && candidate.score < bestHardMove.score) ||
        (hardScore === bestHardMove.hardScore &&
          candidate.score === bestHardMove.score &&
          Math.abs(candidate.slot) < Math.abs(bestHardMove.slot))
      ) {
        bestHardMove = {
          slot: candidate.slot,
          weight: candidate.weight,
          score: candidate.score,
          hardScore,
        }
      }
    }

    if (bestHardMove) {
      return {
        slot: bestHardMove.slot,
        weight: bestHardMove.weight,
      }
    }
  }

  let bestMove = candidateMoves[0]
  for (const candidate of candidateMoves) {
    if (
      candidate.score < bestMove.score ||
      (candidate.score === bestMove.score && Math.abs(candidate.slot) < Math.abs(bestMove.slot))
    ) {
      bestMove = candidate
    }
  }

  return {
    slot: bestMove.slot,
    weight: bestMove.weight,
  }
}

function Balance() {
  const [mode, setMode] = useState<GameMode>('local')
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal')
  const [placements, setPlacements] = useState<PlacedWeight[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A')
  const [startingPlayer, setStartingPlayer] = useState<Player>('A')
  const [selectedWeightByPlayer, setSelectedWeightByPlayer] = useState<Record<Player, number>>({
    A: INITIAL_WEIGHTS[0],
    B: INITIAL_WEIGHTS[0],
  })
  const [weightPool, setWeightPool] = useState<Record<Player, number[]>>(() => createInitialWeightPool())
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [sessionWins, setSessionWins] = useState<Record<Player, number>>({ A: 0, B: 0 })
  const [drawRounds, setDrawRounds] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [lastPlacedSlot, setLastPlacedSlot] = useState<SlotPosition | null>(null)
  const [animationCycle, setAnimationCycle] = useState(0)

  const torque = useMemo(() => computeTorque(placements), [placements])
  const isRoundOver = roundResult !== null
  const placementBySlot = useMemo(
    () => new Map(placements.map((placement) => [placement.slot, placement])),
    [placements],
  )
  const isAiTurn = mode === 'ai' && currentPlayer === 'B' && !isRoundOver
  const currentPlayerWeights = weightPool[currentPlayer]
  const selectedWeight = selectedWeightByPlayer[currentPlayer]

  const beamAngle = useMemo(() => {
    if (roundResult?.reason === 'tip') {
      return roundResult.finalTorque > 0 ? 22 : -22
    }

    const scaled = (torque / SAFE_TORQUE_LIMIT) * 14
    return Math.max(-16, Math.min(16, scaled))
  }, [roundResult, torque])

  const status = useMemo(() => {
    if (roundResult?.reason === 'tip') {
      return `Round ${roundNumber}: Player ${roundResult.loser} tipped the beam (${formatTorque(roundResult.finalTorque)}). Player ${roundResult.winner} wins.`
    }

    if (roundResult?.reason === 'stable') {
      return `Round ${roundNumber}: all slots filled at torque ${formatTorque(roundResult.finalTorque)}. Draw round.`
    }

    const activeLabel =
      currentPlayer === 'A' ? 'Player A' : mode === 'ai' ? 'AI (Player B)' : 'Player B'
    return `Round ${roundNumber} · ${activeLabel} to move · Torque ${formatTorque(torque)} (limit ±${SAFE_TORQUE_LIMIT}).`
  }, [currentPlayer, mode, roundNumber, roundResult, torque])

  const placeWeight = useCallback(
    (slot: SlotPosition, forcedWeight?: number, isAiMove = false) => {
      if (isRoundOver || placementBySlot.has(slot) || (isAiTurn && !isAiMove)) {
        return
      }

      const activeWeights = weightPool[currentPlayer]
      const weightToPlace = forcedWeight ?? selectedWeight
      const selectedIndex = activeWeights.indexOf(weightToPlace)

      if (selectedIndex < 0) {
        return
      }

      const placedWeight: PlacedWeight = { slot, weight: weightToPlace, player: currentPlayer }
      const nextPlacements = [...placements, placedWeight]
      const nextTorque = computeTorque(nextPlacements)

      const nextActiveWeights = [...activeWeights]
      nextActiveWeights.splice(selectedIndex, 1)

      const nextWeightPool: Record<Player, number[]> = {
        ...weightPool,
        [currentPlayer]: nextActiveWeights,
      }
      const nextSelectedWeightByPlayer: Record<Player, number> = {
        ...selectedWeightByPlayer,
        [currentPlayer]: nextActiveWeights[0] ?? INITIAL_WEIGHTS[0],
      }

      setPlacements(nextPlacements)
      setWeightPool(nextWeightPool)
      setSelectedWeightByPlayer(nextSelectedWeightByPlayer)
      setLastPlacedSlot(slot)
      setAnimationCycle((value) => value + 1)

      if (Math.abs(nextTorque) > SAFE_TORQUE_LIMIT) {
        const winner = getOpponent(currentPlayer)
        setSessionWins((wins) => ({
          ...wins,
          [winner]: wins[winner] + 1,
        }))
        setRoundResult({
          reason: 'tip',
          winner,
          loser: currentPlayer,
          finalTorque: nextTorque,
        })
        return
      }

      if (nextPlacements.length === SLOT_POSITIONS.length) {
        setDrawRounds((value) => value + 1)
        setRoundResult({
          reason: 'stable',
          winner: null,
          finalTorque: nextTorque,
        })
        return
      }

      setCurrentPlayer(getOpponent(currentPlayer))
    },
    [currentPlayer, isAiTurn, isRoundOver, placementBySlot, placements, selectedWeight, selectedWeightByPlayer, weightPool],
  )

  useEffect(() => {
    if (!isAiTurn) {
      return
    }

    const aiMove = pickBalanceAiMove(placements, weightPool.B, weightPool.A, aiDifficulty)

    if (!aiMove) {
      return
    }

    const aiTimer = window.setTimeout(() => {
      placeWeight(aiMove.slot, aiMove.weight, true)
    }, BALANCE_AI_DELAY_MS)

    return () => window.clearTimeout(aiTimer)
  }, [aiDifficulty, isAiTurn, placeWeight, placements, weightPool])

  const startNextRound = () => {
    if (!isRoundOver) {
      return
    }

    const nextStarter = getOpponent(startingPlayer)
    setRoundNumber((value) => value + 1)
    setStartingPlayer(nextStarter)
    setCurrentPlayer(nextStarter)
    setPlacements([])
    setWeightPool(createInitialWeightPool())
    setSelectedWeightByPlayer({ A: INITIAL_WEIGHTS[0], B: INITIAL_WEIGHTS[0] })
    setRoundResult(null)
    setLastPlacedSlot(null)
    setAnimationCycle(0)
  }

  const resetSession = () => {
    setRoundNumber(1)
    setStartingPlayer('A')
    setCurrentPlayer('A')
    setPlacements([])
    setWeightPool(createInitialWeightPool())
    setSelectedWeightByPlayer({ A: INITIAL_WEIGHTS[0], B: INITIAL_WEIGHTS[0] })
    setRoundResult(null)
    setLastPlacedSlot(null)
    setAnimationCycle(0)
    setSessionWins({ A: 0, B: 0 })
    setDrawRounds(0)
  }

  const handleModeChange = (nextMode: GameMode) => {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    resetSession()
  }

  const boardInstructionsId = 'balance-board-instructions'
  const controlsInstructionsId = 'balance-controls-instructions'
  const torqueFill = Math.min(100, Math.round((Math.abs(torque) / SAFE_TORQUE_LIMIT) * 100))
  const torqueFillClass =
    Math.abs(torque) > SAFE_TORQUE_LIMIT
      ? 'bg-rose-400'
      : Math.abs(torque) >= SAFE_TORQUE_LIMIT * 0.75
        ? 'bg-amber-300'
        : 'bg-cyan-300'

  return (
    <GameShell status={status} onReset={resetSession}>
      <GameModeToggle mode={mode} onModeChange={handleModeChange} />
      {mode === 'ai' && <GameDifficultyToggle difficulty={aiDifficulty} onDifficultyChange={setAiDifficulty} />}

      <div className="mb-3 grid grid-cols-2 gap-2 text-sm" aria-label="Balance session scoreboard">
        {(['A', 'B'] as const).map((player) => {
          const isActive = !isRoundOver && currentPlayer === player
          const isRoundWinner = roundResult?.winner === player

          return (
            <div
              key={player}
              className={`rounded-lg border px-3 py-2 transition ${
                isRoundWinner
                  ? 'motion-tile-pop border-emerald-300 bg-emerald-500/15'
                  : isActive
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                    : 'border-slate-700 bg-slate-800/70 text-slate-200'
              }`}
              aria-label={`Player ${player}: ${sessionWins[player]} session wins.`}
            >
              <p className="font-semibold">{player === 'B' && mode === 'ai' ? 'AI (Player B)' : `Player ${player}`}</p>
              <p className="text-xs text-slate-300">Session wins: {sessionWins[player]}</p>
              <p className="mt-1 text-[0.7rem] text-slate-400">
                Weights left: {weightPool[player].length > 0 ? weightPool[player].join(', ') : 'none'}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mb-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>
            Torque: <span className="font-semibold text-cyan-200">{formatTorque(torque)}</span>
          </span>
          <span>Safe range: ±{SAFE_TORQUE_LIMIT}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-all ${torqueFillClass}`} style={{ width: `${torqueFill}%` }} />
        </div>
        <p className="mt-2 text-[0.72rem] text-slate-400">
          Draw rounds: {drawRounds}. Place a weight beyond the limit and you lose the round.
        </p>
      </div>

      <p id={boardInstructionsId} className="sr-only">
        Balance beam board with numbered slots from left to right. Placed weights contribute torque based on
        distance from the center support.
      </p>
      <div className="touch-manipulation rounded-xl border border-slate-700/70 bg-indigo-950/45 p-3">
        <svg
          viewBox="0 0 520 280"
          className="mx-auto block w-full max-w-[34rem]"
          role="img"
          aria-label="Balance beam"
          aria-describedby={boardInstructionsId}
        >
          <rect x="22" y="30" width="476" height="220" rx="18" fill="rgba(15,23,42,0.42)" stroke="rgba(71,85,105,0.45)" />
          <line x1="64" y1="226" x2="456" y2="226" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
          <polygon points="260,162 214,226 306,226" fill="#1e293b" stroke="#475569" strokeWidth="3" />

          <g
            transform={`rotate(${beamAngle} ${BOARD_CENTER_X} ${BOARD_CENTER_Y})`}
            className={roundResult?.reason === 'tip' ? 'motion-tile-merge' : undefined}
          >
            <rect x="70" y="108" width="380" height="20" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />

            {SLOT_POSITIONS.map((slot) => {
              const slotX = BOARD_CENTER_X + slot * SLOT_SPACING

              return (
                <g key={`slot-${slot}`}>
                  <line x1={slotX} y1="101" x2={slotX} y2="134" stroke="#67e8f9" strokeOpacity="0.8" strokeWidth="2" />
                  <circle cx={slotX} cy="118" r="4" fill="#bae6fd" />
                </g>
              )
            })}

            {placements.map((placement) => {
              const slotX = BOARD_CENTER_X + placement.slot * SLOT_SPACING
              const colors = PLAYER_COLORS[placement.player]
              const animate = placement.slot === lastPlacedSlot
              const key = animate ? `${placement.slot}-${animationCycle}` : `${placement.slot}`

              return (
                <g key={key} className={animate ? 'motion-drop' : undefined}>
                  <line x1={slotX} y1="128" x2={slotX} y2="162" stroke="#94a3b8" strokeWidth="2.5" />
                  <circle
                    cx={slotX}
                    cy="176"
                    r={14 + placement.weight * 2}
                    fill={colors.pieceFill}
                    stroke={colors.pieceStroke}
                    strokeWidth="3"
                  />
                  <text
                    x={slotX}
                    y="181"
                    textAnchor="middle"
                    fontSize="15"
                    fontWeight="700"
                    fill={colors.pieceText}
                    pointerEvents="none"
                  >
                    {placement.weight}
                  </text>
                </g>
              )
            })}
          </g>

          {roundResult?.reason === 'tip' && (
            <g className="motion-click-pulse">
              <text x="260" y="64" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fda4af">
                TIP!
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
        <p id={controlsInstructionsId} className="text-xs text-slate-300">
          {isAiTurn
            ? 'AI is choosing a weight and slot.'
            : `Choose one remaining weight for Player ${currentPlayer}, then tap or click an empty slot.`}
        </p>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {currentPlayerWeights.map((weight) => {
            const isSelected = selectedWeight === weight

            return (
              <button
                key={weight}
                type="button"
                onClick={() =>
                  setSelectedWeightByPlayer((selected) => ({
                    ...selected,
                    [currentPlayer]: weight,
                  }))
                }
                disabled={isRoundOver || isAiTurn}
                data-pressed={isSelected}
                aria-label={`Select weight ${weight}`}
                className={`motion-control-press touch-manipulation rounded-lg border py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/40 disabled:text-slate-500 ${
                  isSelected
                    ? 'motion-tile-pop border-cyan-300 bg-cyan-500/20 text-cyan-100'
                    : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:border-cyan-400'
                }`}
              >
                Weight {weight}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {SLOT_POSITIONS.map((slot) => {
            const placement = placementBySlot.get(slot)
            const isDisabled = isRoundOver || isAiTurn || Boolean(placement)
            const slotSide = slot < 0 ? 'left' : 'right'
            const slotDistance = Math.abs(slot)

            return (
              <button
                key={slot}
                type="button"
                onClick={() => placeWeight(slot)}
                disabled={isDisabled}
                aria-label={
                  placement
                    ? `Slot ${getSlotLabel(slot)}, occupied by player ${placement.player} weight ${placement.weight}`
                    : `Place selected weight on ${slotSide} slot ${slotDistance}`
                }
                aria-describedby={controlsInstructionsId}
                className={`motion-control-press touch-manipulation rounded-lg border px-2 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed ${
                  placement
                    ? 'border-slate-700 bg-slate-800/65 text-slate-300'
                    : 'border-slate-600 bg-slate-800/85 text-slate-100 hover:border-cyan-400'
                }`}
              >
                <span className="block text-[0.65rem] uppercase tracking-wide text-slate-400">{getSlotLabel(slot)}</span>
                <span className="mt-0.5 block">{placement ? `${placement.player}:${placement.weight}` : 'Empty'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {isRoundOver && (
        <button
          type="button"
          onClick={startNextRound}
          className="motion-control-press mt-3 w-full touch-manipulation rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Start round {roundNumber + 1}
        </button>
      )}
    </GameShell>
  )
}

export default Balance

