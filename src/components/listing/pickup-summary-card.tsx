import type { ReactNode } from "react"
import { BadgeCheck, Clock, MapPin, MessageCircle } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { ButtonAnchor } from "@/components/ui/button"
import { Eyebrow } from "@/components/ui/page-header"
import { cn } from "@/lib/utils"

type PickupSummaryCardProps = {
  /** Role label above the name ("Vendedor", "Comprador"). */
  personRole: ReactNode
  personName: string
  personAvatarSrc?: string
  personVerified?: boolean
  /** Line under the name ("★ 4.95 (80) · Pinheiros, São Paulo"). */
  personDetail?: ReactNode
  /** Section label. Defaults to "Recogida acordada". */
  pickupLabel?: ReactNode
  pickupPlace: ReactNode
  pickupTime: ReactNode
  /** WhatsApp link. Hides the button when missing. */
  whatsappHref?: string
  /** Maps link. Hides the button when missing. */
  mapHref?: string
  className?: string
}

/** Agreed pickup: the other person, place/time, and WhatsApp/Mapa actions. */
function PickupSummaryCard({
  personRole,
  personName,
  personAvatarSrc,
  personVerified = false,
  personDetail,
  pickupLabel = "Recogida acordada",
  pickupPlace,
  pickupTime,
  whatsappHref,
  mapHref,
  className,
}: PickupSummaryCardProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="flex items-center gap-3 p-4">
        <Avatar name={personName} src={personAvatarSrc} size="xl" />
        <div className="min-w-0 flex-1">
          <Eyebrow>{personRole}</Eyebrow>
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="truncate">{personName}</span>
            {personVerified && (
              <BadgeCheck className="size-4 shrink-0 text-verified" aria-hidden />
            )}
          </p>
          {personDetail && <p className="truncate text-sm text-text-muted">{personDetail}</p>}
        </div>
      </div>
      <div className="border-t border-border bg-surface px-4 py-3.5">
        <Eyebrow>{pickupLabel}</Eyebrow>
        <p className="mt-1.5 flex items-start gap-2 text-sm font-medium text-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
          {pickupPlace}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-text-muted">
          <Clock className="size-4 shrink-0" aria-hidden />
          {pickupTime}
        </p>
      </div>
      {(whatsappHref || mapHref) && (
        <div className="flex gap-2 border-t border-border p-3">
          {whatsappHref && (
            <ButtonAnchor
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              size="md"
              className="flex-1"
            >
              <MessageCircle aria-hidden /> WhatsApp
            </ButtonAnchor>
          )}
          {mapHref && (
            <ButtonAnchor
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="md"
              className="flex-1"
            >
              <MapPin aria-hidden /> Mapa
            </ButtonAnchor>
          )}
        </div>
      )}
    </div>
  )
}

export { PickupSummaryCard }
export type { PickupSummaryCardProps }
