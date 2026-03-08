/** @jsxImportSource react */
import type { ReactNode } from 'react'

type GameShellProps = {
  status: string
  onReset: () => void
  children: ReactNode
  scoreLabel?: string
  scoreValue?: number
}

function GameShell({ status, onReset, children, scoreLabel = 'Score', scoreValue }: GameShellProps) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-200">{status}</p>
        {typeof scoreValue === 'number' && (
          <p className="text-sm font-semibold text-cyan-200">
            {scoreLabel}: {scoreValue}
          </p>
        )}
      </div>

      <div className="mt-4">{children}</div>

      <button
        type="button"
        onClick={onReset}
        className="mt-4 w-full touch-manipulation rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        Restart game
      </button>
    </div>
  )
}

export default GameShell

