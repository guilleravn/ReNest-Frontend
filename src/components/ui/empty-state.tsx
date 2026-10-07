import type { ReactNode } from "react"
import { PackageSearch } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  /** Defaults to a package-search icon. */
  icon?: ReactNode
  /** Optional action below the text (e.g. a Button). */
  action?: ReactNode
  className?: string
}

/** Centered "nothing here" message for empty lists and searches. */
function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("mx-auto max-w-sm py-16 text-center", className)}>
      <div className="mx-auto flex justify-center text-text-subtle [&_svg]:size-10">
        {icon ?? <PackageSearch aria-hidden />}
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
