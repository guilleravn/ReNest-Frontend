import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type StickyActionBarProps = {
  /** Usually one full-width Button. */
  children: ReactNode
  /** Small helper text under the action ("Agrega al menos una opción..."). */
  note?: ReactNode
  /** Width of the bar content; match the page container. */
  width?: "narrow" | "wide"
  className?: string
}

/**
 * Bottom bar fixed to the viewport holding the page's main action.
 * Leave bottom padding (e.g. pb-24) on the page so content isn't hidden.
 */
function StickyActionBar({ children, note, width = "narrow", className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6",
          width === "narrow" ? "max-w-2xl" : "max-w-5xl"
        )}
      >
        <div className={cn(width === "wide" && "sm:mx-auto sm:max-w-md")}>
          {children}
          {note && <p className="mt-1.5 text-center text-xs text-text-subtle">{note}</p>}
        </div>
      </div>
    </div>
  )
}

export { StickyActionBar }
export type { StickyActionBarProps }
