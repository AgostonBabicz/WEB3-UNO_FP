import React from 'react'
import '../style/Deck.css'

type UnoDeckProps = {
  size?: 'sm' | 'md' | 'lg'
}

export const UnoDeck: React.FC<UnoDeckProps> = ({ size = 'md' }) => {
  return (
    <div className={`uno-deck ${size}`}>
      <div className="card back layer-3" />
      <div className="card back layer-2" />
      <div className="card back layer-1" />

      <div className="card back top">
        <div className="oval" />
        <div className="uno-mark">UNO</div>
      </div>
    </div>
  )
}
