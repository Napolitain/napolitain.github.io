/** @jsxImportSource react */
import { useCallback, useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'

type RoundStatus = 'playing' | 'won' | 'lost'

type WordEntry = {
  category: string
  word: string
}

const WORD_GROUPS: Readonly<Record<string, readonly string[]>> = {
  Animals: ['PANTHER', 'DOLPHIN', 'GIRAFFE', 'KOALA'],
  Space: ['GALAXY', 'COMET', 'NEBULA', 'ASTRONAUT'],
  Food: ['PANCAKE', 'NOODLES', 'AVOCADO', 'BISCUIT'],
}

const WORD_BANK: ReadonlyArray<WordEntry> = Object.entries(WORD_GROUPS).flatMap(
  ([category, words]) => words.map((word) => ({ category, word })),
)

const CATEGORY_NAMES = Object.keys(WORD_GROUPS).join(', ')
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG_GUESSES = 6

function pickRandomWord(previousWord?: string): WordEntry {
  if (WORD_BANK.length === 1) {
    return WORD_BANK[0]
  }

  let candidate = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]

  while (candidate.word === previousWord) {
    candidate = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
  }

  return candidate
}

function BalloonArt({ wrongGuesses }: { wrongGuesses: number }) {
  const isPopped = wrongGuesses >= MAX_WRONG_GUESSES
  const showRightRope = wrongGuesses < 2
  const showLeftRope = wrongGuesses < 3
  const showBasket = wrongGuesses < 5
  const isBasketDamaged = wrongGuesses >= 4
  const balloonFill = wrongGuesses >= 4 ? '#fb7185' : wrongGuesses >= 2 ? '#38bdf8' : '#22d3ee'

  return (
    <svg viewBox="0 0 220 280" className="h-52 w-full max-w-xs" fill="none" aria-hidden="true">
      <rect
        x="20"
        y="20"
        width="180"
        height="240"
        rx="24"
        fill="#0f172a"
        fillOpacity="0.45"
        stroke="#334155"
        strokeOpacity="0.75"
      />

      {!isPopped ? (
        <g className={wrongGuesses === 0 ? 'motion-drop' : undefined}>
          <ellipse cx="110" cy="86" rx="56" ry="68" fill={balloonFill} stroke="#e2e8f0" strokeWidth="6" />
          <ellipse cx="92" cy="62" rx="13" ry="18" fill="#e0f2fe" fillOpacity="0.5" />

          {wrongGuesses >= 1 && (
            <path
              d="m123 79 8 10m-8-3 10 8m-16 4 9 9"
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          {wrongGuesses >= 4 && (
            <circle cx="124" cy="102" r="7" fill="#1e293b" fillOpacity="0.55" stroke="#f8fafc" strokeWidth="1.5" />
          )}

          {showLeftRope && <line x1="92" y1="152" x2="86" y2="206" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />}
          {showRightRope && (
            <line x1="128" y1="152" x2="134" y2="206" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          )}

          {showBasket && (
            <g transform={isBasketDamaged ? 'rotate(8 110 227)' : undefined}>
              <rect x="78" y="206" width="64" height="42" rx="10" fill="#b45309" stroke="#fdba74" strokeWidth="4" />
              <path d="M78 220h64M78 234h64" stroke="#fcd34d" strokeOpacity="0.5" strokeWidth="3" />
              {isBasketDamaged && (
                <path d="m101 220 10 11 8-9" stroke="#fecaca" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          )}

          {!showBasket && (
            <g className="motion-drop">
              <rect x="84" y="236" width="52" height="32" rx="8" fill="#7c2d12" stroke="#fdba74" strokeWidth="3" fillOpacity="0.8" />
            </g>
          )}
        </g>
      ) : (
        <g className="motion-drop">
          <circle cx="110" cy="90" r="8" fill="#f8fafc" />
          <path
            d="M110 38V58M110 122V142M58 90H78M142 90H162M74 54l14 14M132 112l14 14M146 54l-14 14M88 112l-14 14"
            stroke="#fda4af"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path d="M102 154 94 196M118 154 126 196" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 7" />
          <rect x="82" y="212" width="56" height="36" rx="9" fill="#7c2d12" stroke="#fdba74" strokeWidth="3" />
        </g>
      )}
    </svg>
  )
}

function WordBalloon() {
  const [targetWord, setTargetWord] = useState<WordEntry>(() => pickRandomWord())
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [roundStatus, setRoundStatus] = useState<RoundStatus>('playing')
  const [wins, setWins] = useState(0)

  const uniqueLetters = useMemo(() => Array.from(new Set(targetWord.word.split(''))), [targetWord.word])
  const misses = useMemo(
    () => guessedLetters.filter((letter) => !targetWord.word.includes(letter)),
    [guessedLetters, targetWord.word],
  )

  const submitGuess = useCallback(
    (inputLetter: string) => {
      if (roundStatus !== 'playing') {
        return
      }

      const letter = inputLetter.toUpperCase()

      if (!/^[A-Z]$/.test(letter) || guessedLetters.includes(letter)) {
        return
      }

      const nextGuesses = [...guessedLetters, letter]
      setGuessedLetters(nextGuesses)

      if (targetWord.word.includes(letter)) {
        const solved = uniqueLetters.every((targetLetter) => nextGuesses.includes(targetLetter))

        if (solved) {
          setRoundStatus('won')
          setWins((value) => value + 1)
        }

        return
      }

      const nextWrong = wrongGuesses + 1
      setWrongGuesses(nextWrong)

      if (nextWrong >= MAX_WRONG_GUESSES) {
        setRoundStatus('lost')
      }
    },
    [guessedLetters, roundStatus, targetWord.word, uniqueLetters, wrongGuesses],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (!/^[a-z]$/i.test(event.key)) {
        return
      }

      event.preventDefault()
      submitGuess(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitGuess])

  const handleReset = useCallback(() => {
    setTargetWord((previousWord) => pickRandomWord(previousWord.word))
    setGuessedLetters([])
    setWrongGuesses(0)
    setRoundStatus('playing')
  }, [])

  const maskedWord = targetWord.word.split('').map((letter) => {
    if (roundStatus === 'lost' || guessedLetters.includes(letter)) {
      return letter
    }

    return '•'
  })

  const statusText =
    roundStatus === 'won'
      ? `Great flight! You solved "${targetWord.word}".`
      : roundStatus === 'lost'
        ? `Balloon popped! The word was "${targetWord.word}".`
        : `Category: ${targetWord.category} • ${MAX_WRONG_GUESSES - wrongGuesses} mistakes left.`

  return (
    <GameShell status={statusText} onReset={handleReset} scoreLabel="Wins" scoreValue={wins}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
            <BalloonArt wrongGuesses={wrongGuesses} />

            <div className="w-full space-y-3 sm:max-w-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Word to guess</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {maskedWord.map((character, index) => (
                    <span
                      key={`${character}-${index}`}
                      className="inline-flex h-10 min-w-8 items-center justify-center rounded-md border border-slate-600 bg-slate-800/70 px-2 text-lg font-bold tracking-[0.08em] text-slate-100"
                    >
                      {character}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-200">
                Misses: <span className="font-semibold text-rose-200">{misses.length ? misses.join(', ') : 'None'}</span>
              </p>
              <p className="text-xs text-slate-400">Categories in rotation: {CATEGORY_NAMES}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
          {ALPHABET.map((letter) => {
            const alreadyGuessed = guessedLetters.includes(letter)
            const isCorrectGuess = alreadyGuessed && targetWord.word.includes(letter)
            const isWrongGuess = alreadyGuessed && !targetWord.word.includes(letter)
            const isDisabled = alreadyGuessed || roundStatus !== 'playing'

            return (
              <button
                key={letter}
                type="button"
                onClick={() => submitGuess(letter)}
                disabled={isDisabled}
                aria-label={`Guess letter ${letter}`}
                className={`motion-control-press touch-manipulation rounded-lg border py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  isCorrectGuess
                    ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100'
                    : isWrongGuess
                      ? 'border-rose-400/70 bg-rose-500/20 text-rose-100'
                      : 'border-slate-600 bg-slate-800/80 text-slate-100 hover:border-cyan-400'
                } ${alreadyGuessed ? 'motion-click-pulse opacity-85' : ''} ${
                  isDisabled ? 'cursor-not-allowed disabled:border-slate-700/70 disabled:bg-slate-800/40 disabled:text-slate-500' : ''
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>

        <p className="text-center text-xs text-slate-400">Tap letters or use your keyboard to guess.</p>
      </div>
    </GameShell>
  )
}

export default WordBalloon

