import React, { useEffect } from 'react'

type Props = {
  show: boolean
  title: string
  message: string
  timeoutMs?: number
  onClose: () => void
}

export const PopUpMessage: React.FC<Props> = ({ show, title, message, timeoutMs, onClose }) => {
  useEffect(() => {
    if (!show || !timeoutMs) return
    const id = window.setTimeout(onClose, timeoutMs)
    return () => clearTimeout(id)
  }, [show, timeoutMs, onClose])

  if (!show) return null

  return (
    <div className="pop-up-message-backdrop" onClick={onClose}>
      <div className="pop-up-message" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  )
}