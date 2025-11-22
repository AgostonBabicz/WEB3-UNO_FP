import React, { useEffect, useRef } from 'react'
import '../style/GameOver.css'
import { useRouter } from 'next/navigation'
type GameOverViewProps = {
  winner: string
}

type ConfettiParticle = {
  x: number
  y: number
  r: number
  c: string
  s: number
}

const GameOverView: React.FC<GameOverViewProps> = ({ winner }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const confettiRef = useRef<ConfettiParticle[]>([])
  const animRef = useRef<number | null>(null)
  const router = useRouter()
  const initConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    confettiRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      c: ['#e11d2e', '#2563eb', '#16a34a', '#facc15'][Math.floor(Math.random() * 4)],
      s: Math.random() * 2 + 1,
    }))
  }

  const updateConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    confettiRef.current.forEach((p) => {
      p.y += p.s
      if (p.y > canvas.height) {
        p.y = -10
        p.x = Math.random() * canvas.width
        p.s = Math.random() * 2 + 1
      }
    })
  }

  const drawConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    confettiRef.current.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.c
      ctx.fill()
    })
    updateConfetti()
    animRef.current = requestAnimationFrame(drawConfetti)
  }

  useEffect(() => {
    initConfetti()
    drawConfetti()
    window.addEventListener('resize', initConfetti)

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', initConfetti)
    }
  }, [])

  return (
    <main className="game-over uno-theme">
      <div className="bg-swirl"></div>
      <canvas id="confetti" ref={canvasRef}></canvas>
      <section className="game-over-card">
        <h1>🎉 Game Over 🎉</h1>
        <p className="winner">
          Winner: <strong>{winner}</strong>
        </p>
        <button
          className="btn home-btn"
          onClick={() => {
            router.push('/')
          }}
        >
          Back to Home
        </button>
      </section>
    </main>
  )
}

export default GameOverView
