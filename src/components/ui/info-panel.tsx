import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type InfoPanelProps = {
  title?: ReactNode
  children?: ReactNode
  className?: string
}

/** Soft gray box for short summaries ("Vendido a Mateo Rivas · 26 sep 2026"). */
function InfoPanel({ title, children, className }: InfoPanelProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4 text-sm", className)}>
      {title && <p className="font-semibold text-foreground">{title}</p>}
      {children && <div className="text-text-muted">{children}</div>}
    </div>
  )
}

export { InfoPanel }
export type { InfoPanelProps }
