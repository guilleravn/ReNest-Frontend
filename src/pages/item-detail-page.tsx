import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX } from 'lucide-react'
import { AppHeader } from '@/components/layout/app-header'
import { PageContainer } from '@/components/layout/page-container'
import { ImageGallery } from '@/components/listing/image-gallery'
import { PickupSlotItem, PickupSlotList } from '@/components/listing/pickup-slot-item'
import { ProductSummary } from '@/components/listing/product-summary'
import { SellerCard } from '@/components/listing/seller-card'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { ApiError } from '@/lib/api'
import { getSessionUser, logout, type Me } from '@/lib/auth'
import { cityLabel } from '@/lib/cities'
import {
  conditionLabel,
  formatPickupTime,
  formatPrice,
  formatSellerRating,
} from '@/lib/format'
import { getListing, type ListingDetail } from '@/lib/listings'
import { loginPath } from '@/lib/redirect'
import { getToken } from '@/lib/session'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; listing: ListingDetail }

const UNAVAILABLE_NOTE = {
  PENDING: 'Otra persona ya lo reservó.',
  COMPLETED: 'Este artículo ya se vendió.',
} as const

export function ItemDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [me, setMe] = useState<Me | null>(null)
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null)

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

  useEffect(() => {
    let current = true
    getSessionUser().then(
      (user) => {
        if (!current) return
        setMe(user)
        setLoggedIn(user !== null)
      },
      () => {},
    )
    return () => {
      current = false
    }
  }, [])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const listing = state.status === 'ready' ? state.listing : null
  const showActions = listing?.status === 'ACTIVE' && !listing.viewer.isSeller

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        backTo="/feed"
        user={
          loggedIn
            ? { name: me?.fullName ?? '', email: me?.email, verified: me?.isVerified }
            : undefined
        }
        loginTo={loginPath(location.pathname)}
        onLogout={handleLogout}
      />
      <PageContainer width="medium" bottomSpace={showActions ? 'actions' : 'default'}>
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
              <ButtonLink to="/feed" size="md" variant="secondary">
                Ver artículos
              </ButtonLink>
            }
          />
        )}

        {listing && (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <ImageGallery
              images={listing.photos.map((photo) => photo.url)}
              alt={listing.title}
            />
            <div className="space-y-6">
              <ProductSummary
                size="lg"
                overline={`${listing.category.name} · ${conditionLabel(listing.condition)}`}
                title={listing.title}
                price={formatPrice(listing.priceCents)}
                description={listing.description}
              />

              {listing.status !== 'ACTIVE' && (
                <InfoPanel title="Ya no está disponible">
                  {UNAVAILABLE_NOTE[listing.status]}
                </InfoPanel>
              )}

              {listing.pickupOptions.length > 0 && (
                <section aria-labelledby="pickup-options" className="space-y-3">
                  <h3 id="pickup-options" className="font-sans text-sm font-semibold text-foreground">
                    Lugares y horarios de recogida
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
              )}

              <section aria-label="Vendedor">
                <SellerCard
                  name={listing.seller.fullName}
                  avatarSrc={listing.seller.avatarUrl ?? undefined}
                  verified={listing.seller.isVerified}
                  {...formatSellerRating(listing.seller.rating)}
                  location={cityLabel(listing.seller.city)}
                />
              </section>
            </div>
          </div>
        )}
      </PageContainer>

      {listing && showActions && (
        <StickyActionBar width="wide">
          <div className="grid gap-2">
            <ButtonLink to={`/items/${listing.id}/pickup`} fullWidth>
              Agendar recogida
            </ButtonLink>
            <ButtonLink to={`/items/${listing.id}/contact`} variant="outline" fullWidth>
              ¿Preguntas sobre este producto?
            </ButtonLink>
          </div>
        </StickyActionBar>
      )}
    </div>
  )
}
