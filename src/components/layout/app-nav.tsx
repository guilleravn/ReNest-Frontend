import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { House, Tags, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { pendingSalesLabel } from "@/lib/pending-sales"
import { CountBadge } from "@/components/ui/count-badge"
import { SegmentedControl, SegmentedItem } from "@/components/ui/segmented-control"

type NavItem = {
  label: ReactNode
  to: string
  icon: ReactNode
  /** Counter badge. Hidden when 0/undefined. */
  count?: number
  /** Accessible name of the counter badge. */
  countLabel?: string
}

type AppNavProps = {
  /** Path of the active item. */
  activeTo: string
  /** Defaults to Inicio + Mis artículos + Cuenta. */
  items?: NavItem[]
}

/** `pendingSales` fills the "Mis artículos" counter (SAL-2). */
function defaultNavItems(pendingSales?: number): NavItem[] {
  return [
    { label: "Inicio", to: "/feed", icon: <House aria-hidden /> },
    {
      label: "Mis artículos",
      to: "/listings",
      icon: <Tags aria-hidden />,
      count: pendingSales,
      countLabel: pendingSales ? pendingSalesLabel(pendingSales) : undefined,
    },
    { label: "Cuenta", to: "/account", icon: <UserRound aria-hidden /> },
  ]
}

/** Tab bar under the header, desktop only (`sm` and up). */
function DesktopNav({ activeTo, items = defaultNavItems() }: AppNavProps) {
  return (
    <div className="bg-background">
      <div className="mx-auto hidden max-w-6xl px-4 pb-2 sm:block">
        <nav>
          <SegmentedControl>
            {items.map((item) => (
              <SegmentedItem
                key={item.to}
                to={item.to}
                active={item.to === activeTo}
                icon={item.icon}
                trailing={
                  item.count ? (
                    <CountBadge label={item.countLabel}>{item.count}</CountBadge>
                  ) : undefined
                }
              >
                {item.label}
              </SegmentedItem>
            ))}
          </SegmentedControl>
        </nav>
      </div>
    </div>
  )
}

/** Fixed bottom tab bar, mobile only. Pages using it need pb-24 on mobile. */
function BottomNav({ activeTo, items = defaultNavItems() }: AppNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md sm:hidden">
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = item.to === activeTo
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] text-label font-medium transition-colors",
                  active ? "text-green-strong" : "text-text-muted hover:text-foreground"
                )}
              >
                <span className="relative [&_svg]:size-5">
                  {item.icon}
                  {!!item.count && (
                    <CountBadge
                      label={item.countLabel}
                      className="absolute -top-1.5 -right-2.5 text-count"
                    >
                      {item.count}
                    </CountBadge>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { DesktopNav, BottomNav, defaultNavItems }
export type { NavItem, AppNavProps }
