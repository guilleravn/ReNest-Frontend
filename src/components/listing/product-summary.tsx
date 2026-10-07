import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type ProductSummaryProps = {
  title: string
  /** Already formatted price ("$185"). */
  price: ReactNode
  /** Small uppercase label above the title ("Muebles · Poco uso", "Recogida agendada"). */
  overline?: ReactNode
  /** Muted line under the price ("Electrónica · Poco uso"). */
  meta?: ReactNode
  /** Longer description text. */
  description?: ReactNode
  /** `lg` = buyer item detail (bigger price on desktop). */
  size?: "md" | "lg"
  className?: string
}

/** Title + price block on detail pages. */
function ProductSummary({
  title,
  price,
  overline,
  meta,
  description,
  size = "md",
  className,
}: ProductSummaryProps) {
  return (
    <div className={className}>
      {overline && <p className="text-overline text-text-subtle">{overline}</p>}
      <h2 className="mt-1.5 font-sans text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
        {title}
      </h2>
      <p className={cn("price-text mt-2 text-2xl text-price", size === "lg" ? "lg:text-4xl" : "lg:text-3xl")}>
        {price}
      </p>
      {meta && <p className="mt-1 text-sm text-text-muted">{meta}</p>}
      {description && (
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-text-muted lg:text-base">
          {description}
        </p>
      )}
    </div>
  )
}

export { ProductSummary }
export type { ProductSummaryProps }
