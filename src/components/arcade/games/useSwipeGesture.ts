import { useRef } from 'react'
import type { TouchEvent } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

type SwipeOptions = {
  threshold?: number
  onSwipe: (direction: SwipeDirection) => void
}

type SwipePoint = {
  x: number
  y: number
}

function useSwipeGesture({ onSwipe, threshold = 24 }: SwipeOptions) {
  const touchStartRef = useRef<SwipePoint | null>(null)

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const touchStart = touchStartRef.current

    if (!touchStart) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    touchStartRef.current = null

    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      onSwipe(deltaX > 0 ? 'right' : 'left')
      return
    }

    onSwipe(deltaY > 0 ? 'down' : 'up')
  }

  const onTouchCancel = () => {
    touchStartRef.current = null
  }

  return { onTouchStart, onTouchEnd, onTouchCancel }
}

export default useSwipeGesture
