/** @jsxImportSource react */
type GameMode = 'ai' | 'local'

type GameModeToggleProps = {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
}

function GameModeToggle({ mode, onModeChange }: GameModeToggleProps) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2" role="group" aria-label="Game mode">
      <button
        type="button"
        onClick={() => onModeChange('ai')}
        aria-pressed={mode === 'ai'}
        className={`motion-control-press touch-manipulation rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          mode === 'ai'
            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
            : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:border-cyan-400'
        }`}
      >
        Singleplayer (vs AI)
      </button>
      <button
        type="button"
        onClick={() => onModeChange('local')}
        aria-pressed={mode === 'local'}
        className={`motion-control-press touch-manipulation rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          mode === 'local'
            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
            : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:border-cyan-400'
        }`}
      >
        Local multiplayer
      </button>
    </div>
  )
}

export type { GameMode }
export default GameModeToggle

