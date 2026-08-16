import React from 'react'

export default function SuccessBloom({ className = '' }) {
  return (
    <div className={`success-bloom-wrap ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="success-bloom-svg">
        <circle cx="60" cy="60" r="28" className="sb-core" />
        <g className="sb-rays">
          <circle cx="20" cy="60" r="6" />
          <circle cx="100" cy="60" r="6" />
          <circle cx="60" cy="20" r="6" />
          <circle cx="60" cy="100" r="6" />
        </g>
      </svg>
    </div>
  )
}
