import React from 'react'

type PopUpMessageProps = {
  show: boolean
  title: string
  message: string
  onClose: () => void
}

export const PopUpMessage: React.FC<PopUpMessageProps> = ({
  show,
  title,
  message,
  onClose,
}) => {
  if (!show) return null

  return (
    <div
      className="pop-up-message-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="pop-up-message" aria-live="polite">
        <button className="close-btn" onClick={onClose} aria-label="Close popup">
          x
        </button>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  )
}
