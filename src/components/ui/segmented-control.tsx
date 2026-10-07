import type { ComponentProps, ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

type SegmentedControlProps = ComponentProps<"div">

/** Pill-shaped tab bar ("Agendadas / Completadas", desktop "Inicio / Mis artículos"). */
function SegmentedControl({ className, ...props }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        "flex w-full rounded-lg border border-border bg-surface p-0.5 text-sm",
        className
      )}
      {...props}
    />
  )
}

type SegmentedItemProps = {
  children: ReactNode
  active?: boolean
  /** Leading icon. */
  icon?: ReactNode
  /** Trailing element, usually a CountBadge. */
  trailing?: ReactNode
  /** When set the item renders as a router link, otherwise as a button. */
  to?: string
  onClick?: () => void
  className?: string
}

function SegmentedItem({
  children,
  active = false,
  icon,
  trailing,
  to,
  onClick,
  className,
}: SegmentedItemProps) {
  const classes = cn(
    "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4",
    active
      ? "bg-background text-foreground shadow-card"
      : "text-text-muted hover:text-foreground",
    className
  )
  const content = (
    <>
      {icon}
      {children}
      {trailing}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
        className={classes}
      >
        {content}
      </Link>
    )
  }

  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={classes}>
      {content}
    </button>
  )
}

export { SegmentedControl, SegmentedItem }
export type { SegmentedControlProps, SegmentedItemProps }
