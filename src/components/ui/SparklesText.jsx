import { useEffect, useState } from 'react'

// Lightweight, dependency-free take on Magic UI's SparklesText: this project has no
// Tailwind/framer-motion/shadcn setup, so the effect is reproduced with plain CSS
// keyframes (see .sparkles-text rules in styles/index.css) instead of those libraries.

function random(min, max) {
  return Math.random() * (max - min) + min
}

function generateSparkle(first, second) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    x: `${random(0, 100)}%`,
    y: `${random(0, 100)}%`,
    color: Math.random() > 0.5 ? first : second,
    delay: random(0, 1.6),
    scale: random(0.55, 1),
    life: random(1.3, 2.4),
  }
}

export default function SparklesText({ children, className = '', sparklesCount = 8, colors = {} }) {
  const { first = '#9E7AFF', second = '#FE8BBB' } = colors
  const [sparkles, setSparkles] = useState(() => Array.from({ length: sparklesCount }, () => generateSparkle(first, second)))

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((current) => {
        const next = [...current]
        const index = Math.floor(random(0, next.length))
        next[index] = generateSparkle(first, second)
        return next
      })
    }, 380)
    return () => clearInterval(interval)
  }, [first, second])

  return (
    <span className={`sparkles-text ${className}`.trim()}>
      <span aria-hidden="true" className="sparkles-text__sparkles">
        {sparkles.map((sparkle) => (
          <svg
            className="sparkles-text__sparkle"
            key={sparkle.id}
            style={{
              left: sparkle.x,
              top: sparkle.y,
              '--sparkle-color': sparkle.color,
              '--sparkle-scale': sparkle.scale,
              '--sparkle-life': `${sparkle.life}s`,
              animationDelay: `${sparkle.delay}s`,
            }}
            viewBox="0 0 21 21"
          >
            <path d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.9006 5.49329 13.5563 6.68345C13.7935 7.10871 14.0912 7.66876 14.6088 8.18631L14.7148 8.28535C15.7269 9.18029 16.9294 9.65853 18.2798 10.145L19.1562 10.4574C19.7847 10.6874 19.7847 11.5767 19.1562 11.8067L18.2798 12.1191C16.9294 12.6056 15.7269 13.0839 14.7148 13.9788L14.6088 14.0778C14.0912 14.5953 13.7935 15.1554 13.5563 15.5807C12.9006 16.7708 12.4006 18.0718 11.8618 19.5439L11.1746 21.4203C10.9446 22.0489 10.0553 22.0489 9.82531 21.4203L9.13809 19.5439C8.59929 18.0718 8.09929 16.7708 7.44359 15.5807C7.20643 15.1554 6.90869 14.5953 6.39114 14.0778L6.28518 13.9788C5.27295 13.0839 4.07052 12.6056 2.72006 12.1191L1.84373 11.8067C1.21506 11.5767 1.21506 10.6874 1.84373 10.4574L2.72006 10.145C4.07052 9.65853 5.27295 9.18029 6.28518 8.28535L6.39114 8.18631C6.90869 7.66876 7.20643 7.10871 7.44359 6.68345C8.09929 5.49329 8.59929 4.19229 9.13809 2.72026L9.82531 0.843845Z" />
          </svg>
        ))}
      </span>
      <span className="sparkles-text__text">{children}</span>
    </span>
  )
}
