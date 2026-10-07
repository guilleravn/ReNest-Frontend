import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: ReactNode
  /** Small uppercase label above the title ("AGENDAR RECOGIDA"). */
  overline?: ReactNode
  /** Muted line under the title. */
  description?: ReactNode
  align?: "left" | "center"
  className?: string
}

/** Page title block: optional overline, serif title, optional description. */
function PageHeader({ title, overline, description, align = "left", className }: PageHeaderProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {overline && <p className="text-overline text-text-subtle">{overline}</p>}
      <h2 className={cn("text-2xl", overline && "mt-1")}>{title}</h2>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
    </div>
  )
}

/** Small uppercase label ("VENDEDOR", "RECOGIDA ACORDADA") used inside cards. */
function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-label font-semibold uppercase tracking-overline text-text-subtle",
        className
      )}
    >
      {children}
    </p>
  )
}

export { PageHeader, Eyebrow }
export type { PageHeaderProps }
