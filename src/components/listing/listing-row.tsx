import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge, type BadgeProps } from "@/components/ui/badge"

type ListingRowProps = {
  title: string
  /** Already formatted price ("$130"). */
  price: ReactNode
  imageSrc: string
  imageAlt?: string
  to: string
  /**
   * `active`: highlighted green row with a pulsing status ("Recogida agendada").
   * `default`: plain row with a status pill and chevron ("Activo").
   * `completed`: grayed-out row ("Completado").
   */
  variant?: "active" | "default" | "completed"
  /** Status text: pulsing label for `active`, pill for the others. */
  status?: ReactNode
  /** Pill color for `default` rows. */
  statusTone?: BadgeProps["tone"]
  /** Extra line under the price (pickup place and time). */
  detail?: ReactNode
  /** Element at the far right (e.g. "★ 5"). Replaces the chevron. */
  trailing?: ReactNode
}

/** Pulsing green dot + uppercase label. */
function LiveStatus({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-badge font-bold uppercase tracking-overline text-green-strong">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-green-strong" />
      </span>
      {children}
    </span>
  )
}

/** Compact horizontal card for purchases and own listings. */
function ListingRow({
  title,
  price,
  imageSrc,
  imageAlt,
  to,
  variant = "default",
  status,
  statusTone = "verified",
  detail,
  trailing,
}: ListingRowProps) {
  const isActive = variant === "active"
  const isCompleted = variant === "completed"

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isActive &&
          "relative overflow-hidden border-green-strong/20 bg-green-surface/60 pl-4 shadow-card transition-shadow hover:shadow-menu",
        variant === "default" && "border-border bg-card transition-colors hover:bg-muted",
        isCompleted && "border-border/50 bg-surface-sunken"
      )}
    >
      {isActive && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-green-strong" />
      )}
      <div
        className={cn(
          "relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken",
          isCompleted && "opacity-60 grayscale"
        )}
      >
        <img
          src={imageSrc}
          alt={imageAlt ?? title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        {isActive && status && <LiveStatus>{status}</LiveStatus>}
        <p
          className={cn(
            "truncate text-sm font-semibold",
            isActive && "mt-0.5",
            isCompleted ? "text-text-muted" : "text-foreground"
          )}
        >
          {title}
        </p>
        <p className={cn("price-text text-sm", isCompleted ? "text-text-subtle" : "text-price")}>
          {price}
        </p>
        {detail && <p className="mt-0.5 truncate text-xs text-text-muted">{detail}</p>}
        {!isActive && status && (
          <Badge size="sm" tone={isCompleted ? "neutral" : statusTone} className="mt-1">
            {status}
          </Badge>
        )}
      </div>
      {trailing ? (
        <span className="shrink-0 text-xs font-medium text-text-subtle">{trailing}</span>
      ) : (
        variant === "default" && (
          <ChevronRight className="size-4 shrink-0 text-text-subtle" aria-hidden />
        )
      )}
    </Link>
  )
}

/** Responsive grid for ListingRows. Wrap each row in an <li>. */
function ListingRowGrid({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</ul>
}

export { ListingRow, ListingRowGrid, LiveStatus }
export type { ListingRowProps }
