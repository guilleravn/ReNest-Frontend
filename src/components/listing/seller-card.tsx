import type { ReactNode } from "react"
import { BadgeCheck, MapPin, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/ui/badge"

type SellerCardProps = {
  name: string
  avatarSrc?: string
  /** Shows the check next to the name and the "Vendedor verificado" pill. */
  verified?: boolean
  /** Rating text ("4.9"). */
  rating?: ReactNode
  /** Review count text ("63 reseñas"). */
  reviews?: ReactNode
  location?: ReactNode
  /** Extra pills next to the verified badge. */
  badges?: ReactNode
  className?: string
}

/** Seller summary on the item detail page. */
function SellerCard({
  name,
  avatarSrc,
  verified = false,
  rating,
  reviews,
  location,
  badges,
  className,
}: SellerCardProps) {
  const showBadges = verified || badges

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <div className="flex items-center gap-3">
        <Avatar name={name} src={avatarSrc} size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {name}
            {verified && <BadgeCheck className="size-4 shrink-0 text-verified" aria-hidden />}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-text-muted">
            {rating && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <Star className="size-3 fill-amber text-amber" aria-hidden />
                {rating}
                {reviews && <> · {reviews}</>}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                <MapPin className="size-3" aria-hidden />
                {location}
              </span>
            )}
          </div>
        </div>
      </div>
      {showBadges && (
        <div className="mt-3 flex flex-wrap gap-2">
          {verified && <VerifiedBadge />}
          {badges}
        </div>
      )}
    </div>
  )
}

export { SellerCard }
export type { SellerCardProps }
