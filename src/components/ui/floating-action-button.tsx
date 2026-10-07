import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type FloatingActionButtonProps = {
  children: ReactNode
  icon?: ReactNode
  to: string
  className?: string
}

/**
 * Round floating action ("+ Nuevo artículo"), fixed bottom-right.
 * Sits above the mobile BottomNav and aligns with the 6xl container on desktop.
 */
function FloatingActionButton({ children, icon, to, className }: FloatingActionButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        buttonVariants({ variant: "primary", size: "lg" }),
        "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 rounded-full pr-5 pl-4 shadow-sheet sm:right-[max(1rem,calc(50%-36rem+1rem))] sm:bottom-6",
        className
      )}
    >
      {icon}
      {children}
    </Link>
  )
}

export { FloatingActionButton }
export type { FloatingActionButtonProps }
