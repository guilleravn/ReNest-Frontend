import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  /** Current rating, 0 means none selected. */
  value: number
  onChange?: (value: number) => void
  max?: number
  label?: string
  className?: string
}

/** Interactive 1–N star picker (seller rating). */
function StarRating({
  value,
  onChange,
  max = 5,
  label = "Califica del 1 al 5",
  className,
}: StarRatingProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= value
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === value}
            aria-label={`${starValue} ${starValue === 1 ? "estrella" : "estrellas"}`}
            onClick={() => onChange?.(starValue)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Star
              className={cn(
                "size-9 transition-colors",
                filled ? "fill-amber text-amber" : "fill-transparent text-border-strong"
              )}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}

export { StarRating }
export type { StarRatingProps }
