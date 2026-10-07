import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { BadgeCheck, ChevronLeft, LogOut, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { CountBadge } from "@/components/ui/count-badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

type HeaderUser = {
  name: string
  email?: string
  location?: string
  avatarSrc?: string
  verified?: boolean
}

type AccountMenuItem = {
  label: ReactNode
  icon?: ReactNode
  onClick?: () => void
  destructive?: boolean
}

type AppHeaderProps = {
  user: HeaderUser
  /** Scheduled purchases counter on the "Mis compras" link. Hidden when 0/undefined. */
  purchasesCount?: number
  purchasesTo?: string
  homeTo?: string
  /** When set, a back arrow shows on mobile pointing here. */
  backTo?: string
  /** Bottom border. Turn off on pages where the desktop nav sits right below. */
  bordered?: boolean
  /** Extra account menu entries shown above "Cerrar sesión". */
  menuItems?: AccountMenuItem[]
  onLogout?: () => void
}

/** Sticky top bar: logo, "Mis compras" link and account menu. */
function AppHeader({
  user,
  purchasesCount,
  purchasesTo = "/purchases",
  homeTo = "/feed",
  backTo,
  bordered = true,
  menuItems = [],
  onLogout,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/85 backdrop-blur-md",
        bordered && "border-b border-border"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {backTo && (
          <Link
            to={backTo}
            aria-label="Volver"
            className={cn(
              "-ml-2 inline-flex size-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-muted hover:text-foreground sm:hidden",
              focusRing
            )}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        )}
        <Link
          to={homeTo}
          aria-label="Inicio de ReNest"
          className={cn("flex items-center rounded-lg", focusRing)}
        >
          <img
            src="/brand/logo-horizontal.svg"
            alt="ReNest"
            width={108}
            height={40}
            className="h-9 w-auto sm:h-10"
          />
        </Link>
        <div className="flex-1" />
        <Link
          to={purchasesTo}
          aria-label={
            purchasesCount ? `Mis compras, ${purchasesCount} agendadas` : "Mis compras"
          }
          className={cn(
            "relative -mr-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-muted hover:text-foreground",
            focusRing
          )}
        >
          <span className="relative">
            <ShoppingBag className="size-5" aria-hidden />
            {!!purchasesCount && (
              <CountBadge className="absolute -top-1.5 -right-1.5">{purchasesCount}</CountBadge>
            )}
          </span>
          <span className="hidden sm:inline">Mis compras</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Mi cuenta"
            className={cn("ml-1 rounded-full transition-opacity hover:opacity-90", focusRing)}
          >
            <Avatar name={user.name} src={user.avatarSrc} size="sm" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <Avatar name={user.name} src={user.avatarSrc} size="md" />
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="flex items-center gap-1 truncate text-sm font-medium text-foreground">
                  <span className="truncate">{user.name}</span>
                  {user.verified && (
                    <BadgeCheck className="size-3.5 shrink-0 text-verified" aria-hidden />
                  )}
                </span>
                {user.email && (
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                )}
                {user.location && (
                  <span className="truncate text-xs text-muted-foreground">{user.location}</span>
                )}
              </div>
            </div>
            {menuItems.length > 0 && <DropdownMenuSeparator />}
            {menuItems.map((item, index) => (
              <DropdownMenuItem
                key={index}
                variant={item.destructive ? "destructive" : "default"}
                onClick={item.onClick}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}
            {onLogout && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onLogout}>
                  <LogOut aria-hidden />
                  Cerrar sesión
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { AppHeader }
export type { AppHeaderProps, HeaderUser, AccountMenuItem }
