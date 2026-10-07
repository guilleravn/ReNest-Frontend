import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Badge, VerifiedBadge, type BadgeProps } from "@/components/ui/badge"

type ProductCardProps = {
  title: string
  /** Already formatted price ("$185"). */
  price: ReactNode
  imageSrc: string
  imageAlt?: string
  /** Small uppercase label ("Muebles"). */
  category?: ReactNode
  /** Condition pill text ("Poco uso"). */
  condition?: ReactNode
  /** Condition pill color. */
  conditionTone?: BadgeProps["tone"]
  location?: ReactNode
  /** Shows the "Vendedor verificado" pill on the photo. */
  verified?: boolean
  to: string
}

/** Grid card for an item for sale (feed). */
function ProductCard({
  title,
  price,
  imageSrc,
  imageAlt,
  category,
  condition,
  conditionTone = "blue",
  location,
  verified = false,
  to,
}: ProductCardProps) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-menu focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken">
        <img
          src={imageSrc}
          alt={imageAlt ?? title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {verified && <VerifiedBadge variant="overlay" className="absolute top-2 left-2" />}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {(category || condition) && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-overline text-text-subtle">{category}</p>
            {condition && <Badge tone={conditionTone}>{condition}</Badge>}
          </div>
        )}
        <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-foreground">{title}</p>
        <p className="price-text mt-1 text-lg text-price">{price}</p>
        {location && (
          <p className="mt-auto truncate pt-2 text-xs text-text-muted">{location}</p>
        )}
      </div>
    </Link>
  )
}

/** Responsive grid for ProductCards. Wrap each card in an <li>. */
function ProductGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </ul>
  )
}

export { ProductCard, ProductGrid }
export type { ProductCardProps }
