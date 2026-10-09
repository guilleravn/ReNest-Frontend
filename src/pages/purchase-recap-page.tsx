import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { PickupSummaryCard } from '@/components/listing/pickup-summary-card'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { PageHeader } from '@/components/ui/page-header'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { ApiError } from '@/lib/api'
import { conditionLabel, formatPickupTime, formatPrice } from '@/lib/format'
import { mapsHref } from '@/lib/maps'
import { getReservation, type ReservationDetail } from '@/lib/reservations'
import { pickupMessage, whatsappHref } from '@/lib/whatsapp'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; purchase: ReservationDetail }

/**
 * Pickup recap of one purchase: the item, the seller with WhatsApp, the agreed
 * pickup pair and a Maps link (PUR-3). The server says which actions apply
 * (`actions`); the seller's handover never hides the buyer's (PUR-2, PUR-4).
 */
export function PurchaseRecapPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getReservation(id).then(
      (purchase) => current && setState({ status: 'ready', purchase }),
      (error: unknown) =>
        current &&
        setState({
          status: error instanceof ApiError && error.status === 404 ? 'not-found' : 'error',
        }),
    )
    return () => {
      current = false
    }
  }, [id, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  const purchase = state.status === 'ready' ? state.purchase : null

  // The seller has their own view of the same reservation.
  if (purchase?.viewerRole === 'SELLER') {
    return <Navigate to={`/sales/${purchase.id}`} replace />
  }

  const { actions } = purchase ?? {}
  const hasAction = Boolean(actions?.canConfirmReception || actions?.canRate)

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo="/purchases" />
      <PageContainer width="narrow" bottomSpace={hasAction ? 'actions' : 'default'} className="space-y-6">
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar la compra"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button size="md" variant="secondary" onClick={retry}>
                Reintentar
              </Button>
            }
          />
        )}

        {state.status === 'not-found' && (
          <EmptyState
            icon={<PackageX aria-hidden />}
            title="Esta compra no existe"
            description="Puede que el enlace esté mal escrito."
            action={
              <ButtonLink to="/purchases" size="md" variant="secondary">
                Ver mis compras
              </ButtonLink>
            }
          />
        )}

        {purchase && (
          <>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-sunken">
              <img
                src={purchase.listing.coverPhotoUrl}
                alt={purchase.listing.title}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <Badge tone={purchase.buyerReceivedAt ? 'neutral' : 'green'} size="sm">
                {purchase.buyerReceivedAt ? 'Completado' : 'Recogida agendada'}
              </Badge>
              <PageHeader title={purchase.listing.title} />
              <p className="price-text text-lg text-price">{formatPrice(purchase.listing.priceCents)}</p>
              <p className="text-sm text-text-muted">
                {purchase.listing.category.name} · {conditionLabel(purchase.listing.condition)}
              </p>
            </div>

            {purchase.sellerHandedOverAt && (
              <InfoPanel title="El vendedor confirmó la entrega">
                Cuando tengas el artículo, confirma que lo recogiste.
              </InfoPanel>
            )}

            <PickupSummaryCard
              personRole="Vendedor"
              personName={purchase.counterpart.fullName}
              personAvatarSrc={purchase.counterpart.avatarUrl ?? undefined}
              personVerified={purchase.counterpart.isVerified}
              pickupPlace={purchase.pickupOption.locationLabel}
              pickupTime={formatPickupTime(
                purchase.pickupOption.weekdays,
                purchase.pickupOption.startTime,
                purchase.pickupOption.endTime,
              )}
              whatsappHref={whatsappHref(
                purchase.counterpart.phoneE164,
                pickupMessage(
                  purchase.counterpart.fullName,
                  purchase.listing.title,
                  purchase.pickupOption.locationLabel,
                ),
              )}
              mapHref={mapsHref(purchase.pickupOption.locationLabel)}
            />
          </>
        )}
      </PageContainer>

      {purchase && actions?.canConfirmReception && (
        <StickyActionBar>
          <ButtonLink to={`/purchases/${purchase.id}/checklist`} fullWidth>
            Marcar como recogido
          </ButtonLink>
        </StickyActionBar>
      )}
      {purchase && actions?.canRate && (
        <StickyActionBar>
          <ButtonLink to={`/purchases/${purchase.id}/rate`} fullWidth>
            Calificar al vendedor
          </ButtonLink>
        </StickyActionBar>
      )}
    </div>
  )
}
