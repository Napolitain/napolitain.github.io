/** @jsxImportSource react */
type AIDifficulty = 'easy' | 'normal' | 'hard'

type GameDifficultyToggleProps = {
  difficulty: AIDifficulty
  onDifficultyChange: (difficulty: AIDifficulty) => void
}

const DIFFICULTIES: ReadonlyArray<{ id: AIDifficulty; label: string }> = [
  { id: 'easy', label: 'Easy' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Hard' },
]

function GameDifficultyToggle({ difficulty, onDifficultyChange }: GameDifficultyToggleProps) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2" role="group" aria-label="AI difficulty">
      {DIFFICULTIES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onDifficultyChange(item.id)}
          aria-pressed={difficulty === item.id}
          className={`motion-control-press touch-manipulation rounded-lg border px-2 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            difficulty === item.id
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
              : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:border-cyan-400'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export type { AIDifficulty }
export default GameDifficultyToggle

