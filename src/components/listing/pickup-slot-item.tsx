import type { ReactNode } from "react"
import { Clock, MapPin, Trash2 } from "lucide-react"

type PickupSlotItemProps = {
  place: string
  /** Days and hours ("los lunes · 18:00–20:00"). */
  time: ReactNode
  /** Shows a trash button when provided. */
  onRemove?: () => void
  /** Keeps the trash button visible but disabled (e.g. the listing's last pair). */
  removeDisabled?: boolean
}

/** One pickup time/place option the seller added (new listing step 2, pickup times). */
function PickupSlotItem({ place, time, onRemove, removeDisabled = false }: PickupSlotItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-start gap-1.5 text-sm font-semibold text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
          {place}
        </p>
        <p className="mt-1 flex items-center gap-1.5 pl-[1.375rem] text-xs text-text-muted">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {time}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          aria-label={`Quitar ${place}`}
          onClick={onRemove}
          disabled={removeDisabled}
          className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-text-muted"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </li>
  )
}

/** List wrapper for PickupSlotItems. */
function PickupSlotList({ children }: { children: ReactNode }) {
  return <ul className="space-y-2">{children}</ul>
}

export { PickupSlotItem, PickupSlotList }
export type { PickupSlotItemProps }
