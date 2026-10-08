import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CircleAlert, CircleCheck, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ProductSummary } from '@/components/listing/product-summary'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { ApiError } from '@/lib/api'
import { conditionLabel, formatPrice } from '@/lib/format'
import { getListing, type ListingDetail } from '@/lib/listings'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; listing: ListingDetail }

/** Where the seller lands after publishing (LST-10). */
export function ListingPublishedPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getListing(id).then(
      (listing) =>
        current &&
        setState(listing.viewer.isSeller ? { status: 'ready', listing } : { status: 'not-found' }),
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

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo="/listings" />
      <PageContainer width="narrow">
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar tu artículo"
            description="Ya está publicado. Revisa tu conexión e inténtalo de nuevo."
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
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            <CircleCheck aria-hidden className="size-12 text-green-strong" />
            <h1 className="text-2xl font-semibold text-foreground">¡Artículo publicado!</h1>

            <div className="flex w-full items-start gap-4 text-left">
              <img
                src={listing.photos[0]?.url}
                alt={listing.title}
                className="aspect-square w-20 shrink-0 rounded-xl bg-surface-sunken object-cover"
              />
              <ProductSummary
                className="min-w-0"
                title={listing.title}
                price={formatPrice(listing.priceCents)}
                meta={`${listing.category.name} · ${conditionLabel(listing.condition)}`}
              />
            </div>

            <InfoPanel className="w-full text-left">
              Ya está activo y cualquiera puede verlo en el inicio. Cuando alguien lo reserve, lo
              verás en Mis artículos, en En proceso.
            </InfoPanel>

            <div className="flex w-full flex-col gap-2.5">
              <ButtonLink to="/listings?status=ACTIVE" fullWidth>
                Ir a Mis artículos
              </ButtonLink>
              <ButtonLink to={`/items/${listing.id}`} variant="ghost" fullWidth>
                Ver cómo lo ven los compradores
              </ButtonLink>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
