import React, { useState } from 'react'

export default function StarRating({ value = 0, interactive = false, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0)
  const [anim, setAnim] = useState(null)
  
  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-2xl'

  return (
    <div className={`flex items-center gap-1 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value)
        const isHovered = interactive && star <= hover
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => {
              if (interactive) {
                onChange?.(star)
                setAnim(star)
                setTimeout(() => setAnim(null), 400)
              }
            }}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            disabled={!interactive}
            className={`transition-all duration-200 ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${anim === star ? 'scale-125 animate-pulse' : 'scale-100'} ${
              filled 
                ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.4)]' 
                : 'text-slate-600'
            }`}
          >
            ★
          </button>
        )
      })}
      {!interactive && value > 0 && (
        <span className="ml-2 text-sm text-slate-400 font-medium">{Number(value).toFixed(1)}</span>
      )}
    </div>
  )
}
