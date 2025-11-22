'use client'
import React, { useEffect } from 'react'

type Props = {
  show: boolean
  title: string
  message: string
  timeoutMs?: number
  onClose: () => void
}

export const PopUpBox: React.FC<Props> = ({ show, title, message, timeoutMs, onClose }) => {
  useEffect(() => {
    if (!show || !timeoutMs) return
    const id = window.setTimeout(onClose, timeoutMs)
    return () => clearTimeout(id)
  }, [show, timeoutMs, onClose])

  if (!show) return null

  return (
    <div className="inline-notice" aria-live="polite" role="status">
      <h2 className="title">{title}</h2>
      <p className="msg">{message}</p>
    </div>
  )
}
