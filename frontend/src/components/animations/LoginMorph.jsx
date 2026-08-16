import React from 'react'

export default function LoginMorph({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="lm-blob lm-blob-1" />
      <div className="lm-blob lm-blob-2" />
      <div className="lm-blob lm-blob-3" />
    </div>
  )
}
