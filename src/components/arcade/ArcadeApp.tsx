/** @jsxImportSource react */
import { useState } from 'react'
import type { ComponentType } from 'react'
import '@/styles/arcade.css'
import Balance from './games/Balance'
import Checkers from './games/Checkers'
import ConnectFour from './games/ConnectFour'
import DotsAndBoxes from './games/DotsAndBoxes'
import Game2048 from './games/Game2048'
import GridAttack from './games/GridAttack'
import Reversi from './games/Reversi'
import SnakeGame from './games/SnakeGame'
import Takeover from './games/Takeover'
import TicTacToe from './games/TicTacToe'
import WordBalloon from './games/WordBalloon'

type GameId =
  | 'tic-tac-toe'
  | 'connect-four'
  | 'game-2048'
  | 'snake'
  | 'reversi'
  | 'dots-and-boxes'
  | 'word-balloon'
  | 'grid-attack'
  | 'checkers'
  | 'balance'
  | 'takeover'

type GameDefinition = {
  id: GameId
  name: string
  description: string
  Component: ComponentType
}

const GAMES: ReadonlyArray<GameDefinition> = [
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'Classic 3x3 strategy game for two players.',
    Component: TicTacToe,
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    description: 'Drop discs into columns and connect four in a row.',
    Component: ConnectFour,
  },
  {
    id: 'game-2048',
    name: '2048',
    description: 'Merge equal tiles and chase higher powers of two.',
    Component: Game2048,
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat food, grow longer, and avoid collisions.',
    Component: SnakeGame,
  },
  {
    id: 'reversi',
    name: 'Reversi',
    description: 'Capture and flip discs by surrounding your opponent.',
    Component: Reversi,
  },
  {
    id: 'dots-and-boxes',
    name: 'Dots and Boxes',
    description: 'Draw edges, close boxes, and chain extra turns.',
    Component: DotsAndBoxes,
  },
  {
    id: 'word-balloon',
    name: 'Word Balloon',
    description: 'Guess letters before the balloon pops.',
    Component: WordBalloon,
  },
  {
    id: 'grid-attack',
    name: 'Grid Attack',
    description: 'Hunt enemy ships in a tactical sea battle.',
    Component: GridAttack,
  },
  {
    id: 'checkers',
    name: 'Checkers',
    description: 'Capture diagonally, chain jumps, and crown kings.',
    Component: Checkers,
  },
  {
    id: 'balance',
    name: 'Balance',
    description: 'Place weighted pieces and keep the beam stable.',
    Component: Balance,
  },
  {
    id: 'takeover',
    name: 'Takeover',
    description: 'Expand, jump, and convert nearby enemy tokens.',
    Component: Takeover,
  },
]

function App() {
  const [activeGameId, setActiveGameId] = useState<GameId>('tic-tac-toe')
  const activeGame = GAMES.find((game) => game.id === activeGameId) ?? GAMES[0]
  const ActiveGameComponent = activeGame.Component

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center">
        <section className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
          <h1 className="text-center text-3xl font-bold tracking-tight">Mini Arcade</h1>
          <p className="mt-2 text-center text-sm text-slate-300">Pick a game and start playing.</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GAMES.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => setActiveGameId(game.id)}
                aria-pressed={activeGameId === game.id}
                className={`touch-manipulation rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  activeGameId === game.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                    : 'border-slate-600 bg-slate-800/80 text-slate-200 hover:border-cyan-400'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
            <h2 className="text-xl font-bold tracking-tight">{activeGame.name}</h2>
            <p className="mt-1 text-sm text-slate-300">{activeGame.description}</p>
            <div className="mt-4">
              <ActiveGameComponent />
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

export default App

