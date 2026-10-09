import { useEffect, useRef, type ReactNode } from "react"
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
 * Bottom bar holding the page's main action. Render it as the last child of
 * the page's `min-h-dvh flex-col` wrapper, after `PageContainer`: it sticks to
 * the bottom of the viewport while scrolling and takes its own space at the
 * end, so it never covers the content.
 *
 * It publishes its height as `--action-bar-height`, which `scroll-padding-bottom`
 * uses so a focused field scrolls into view above the bar.
 */
function StickyActionBar({ children, note, width = "narrow", className }: StickyActionBarProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = ref.current
    if (!bar) return
    const root = document.documentElement
    const publishHeight = () =>
      root.style.setProperty("--action-bar-height", `${bar.offsetHeight}px`)
    publishHeight()
    const observer = new ResizeObserver(publishHeight)
    observer.observe(bar)
    return () => {
      observer.disconnect()
      root.style.removeProperty("--action-bar-height")
    }
  }, [])

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Acciones"
      className={cn(
        "sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur",
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
