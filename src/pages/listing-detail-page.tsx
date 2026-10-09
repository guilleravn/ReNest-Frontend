import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX, Pencil } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ImageGallery } from '@/components/listing/image-gallery'
import { PickupSlotItem, PickupSlotList } from '@/components/listing/pickup-slot-item'
import { ProductSummary } from '@/components/listing/product-summary'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { TextLink } from '@/components/ui/text-link'
import { ApiError } from '@/lib/api'
import { conditionLabel, formatPickupTime, formatPrice } from '@/lib/format'
import { getListing, type ListingDetail } from '@/lib/listings'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; listing: ListingDetail }

const MY_LISTINGS_TAB = {
  PENDING: 'En proceso',
  COMPLETED: 'Completados',
} as const

/** The seller's view of one of their listings, opened from "Activos". */
export function ListingDetailPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getListing(id).then(
      (listing) => current && setState({ status: 'ready', listing }),
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

  const listing = state.status === 'ready' ? state.listing : null

  // Someone else's listing: show it as any buyer sees it.
  if (listing && !listing.viewer.isSeller) {
    return <Navigate to={`/items/${listing.id}`} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo="/listings" />
      <PageContainer width="medium">
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando artículo…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar el artículo"
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
            title="Este artículo no existe"
            description="Puede que el enlace esté mal escrito."
            action={
              <ButtonLink to="/listings" size="md" variant="secondary">
                Ver mis artículos
              </ButtonLink>
            }
          />
        )}

        {listing && (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <ImageGallery images={listing.photos.map((photo) => photo.url)} alt={listing.title} />
            <div className="space-y-6">
              <div className="space-y-3">
                {listing.status === 'ACTIVE' && <Badge tone="green">Activo</Badge>}
                <ProductSummary
                  overline={`${listing.category.name} · ${conditionLabel(listing.condition)}`}
                  title={listing.title}
                  price={formatPrice(listing.priceCents)}
                  description={listing.description}
                />
              </div>

              {/* Only while Active: once reserved the listing is frozen (LST-11). */}
              {listing.viewer.canEdit && (
                <ButtonLink to={`/listings/${listing.id}/edit`} variant="outline" fullWidth>
                  <Pencil className="size-4" aria-hidden />
                  Editar artículo
                </ButtonLink>
              )}

              {listing.status === 'ACTIVE' ? (
                <section aria-labelledby="pickup-options" className="space-y-3">
                  <h3 id="pickup-options" className="font-sans text-sm font-semibold text-foreground">
                    Tus lugares y horarios de recogida
                  </h3>
                  <PickupSlotList>
                    {listing.pickupOptions.map((option) => (
                      <PickupSlotItem
                        key={option.id}
                        place={option.locationLabel}
                        time={formatPickupTime(option.weekdays, option.startTime, option.endTime)}
                      />
                    ))}
                  </PickupSlotList>
                </section>
              ) : (
                <InfoPanel title="Este artículo ya no está activo">
                  Encuéntralo en{' '}
                  <TextLink to={`/listings?status=${listing.status}`}>
                    {MY_LISTINGS_TAB[listing.status]}
                  </TextLink>{' '}
                  de Mis artículos.
                </InfoPanel>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
