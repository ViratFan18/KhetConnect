import { useState } from 'react'

export default function StarRating({ value = 0, interactive = false, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0)
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value)
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'} ${
              filled ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </button>
        )
      })}
      {!interactive && value > 0 && (
        <span className="ml-1 text-sm text-gray-600">{Number(value).toFixed(1)}</span>
      )}
    </div>
  )
}
