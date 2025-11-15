import React from 'react'
import '../style/Card.css'
import { CardNumber, Color, Type } from '../types/deck.types'

type UnoCardProps = {
  type: Type
  color?: Color
  number?: CardNumber
}

function numberLabel(n?: CardNumber | string | number): string {
  if (n == null) return ''
  const s = String(n)
  return s.startsWith('N') ? s.slice(1) : s
}

export const UnoCard: React.FC<UnoCardProps> = ({ type, color, number }) => {
  const label =
    type === 'NUMBERED'
      ? numberLabel(number)
      : type === 'DRAW'
      ? '+2'
      : type === 'WILD_DRAW'
      ? '+4'
      : type === 'REVERSE'
      ? '↺'
      : type === 'SKIP'
      ? '⦸'
      : 'WILD'

  const mainClassName =
    'main' +
    (type !== 'NUMBERED' && type !== 'WILD' && type !== 'WILD_DRAW' ? ' symbol' : '')

  const colorClass = color ? String(color).toLowerCase() : 'wild'

  return (
    <div className={`uno-card ${colorClass}`}>
      <div className="oval" />

      <span className="corner top-left">{label}</span>

      <span className={mainClassName}>{label}</span>

      <span className="corner bottom-right">{label}</span>
    </div>
  )
}
