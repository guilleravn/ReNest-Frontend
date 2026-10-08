import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { BottomNav, DesktopNav } from '@/components/layout/app-nav'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ProductCard, ProductGrid } from '@/components/listing/product-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { cityLabel } from '@/lib/cities'
import { conditionLabel, conditionTone, formatPrice } from '@/lib/format'
import { getFeed, type ListingCard } from '@/lib/listings'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; listings: ListingCard[]; nextCursor: string | null }

type MoreState = 'idle' | 'loading' | 'error'

/** Public feed: Active listings, newest first, 20 at a time (BRW-1, BRW-10, GEN-5). */
export function FeedPage() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [more, setMore] = useState<MoreState>('idle')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getFeed().then(
      (page) =>
        current &&
        setState({ status: 'ready', listings: page.data, nextCursor: page.nextCursor }),
      () => current && setState({ status: 'error' }),
    )
    return () => {
      current = false
    }
  }, [attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  function loadMore() {
    if (state.status !== 'ready' || !state.nextCursor) return
    setMore('loading')
    getFeed({ cursor: state.nextCursor }).then(
      (page) => {
        setState({
          status: 'ready',
          listings: [...state.listings, ...page.data],
          nextCursor: page.nextCursor,
        })
        setMore('idle')
      },
      () => setMore('error'),
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader bordered={false} />
      <DesktopNav activeTo="/feed" />
      <PageContainer bottomSpace="nav" className="space-y-6">
        <PageHeader title="Encuentra algo de segunda mano" />

        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando artículos…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar los artículos"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button size="md" variant="secondary" onClick={retry}>
                Reintentar
              </Button>
            }
          />
        )}

        {state.status === 'ready' && state.listings.length === 0 && (
          <EmptyState
            title="Todavía no hay artículos"
            description="Vuelve pronto: cada día se publican cosas nuevas."
          />
        )}

        {state.status === 'ready' && state.listings.length > 0 && (
          <>
            <ProductGrid>
              {state.listings.map((listing) => (
                <li key={listing.id}>
                  <ProductCard
                    to={`/items/${listing.id}`}
                    title={listing.title}
                    price={formatPrice(listing.priceCents)}
                    imageSrc={listing.coverPhotoUrl}
                    category={listing.category.name}
                    condition={conditionLabel(listing.condition)}
                    conditionTone={conditionTone(listing.condition)}
                    location={cityLabel(listing.city)}
                    verified={listing.sellerIsVerified}
                  />
                </li>
              ))}
            </ProductGrid>

            {state.nextCursor && (
              <div className="flex flex-col items-center gap-2">
                {more === 'error' && (
                  <p role="alert" className="text-sm text-text-muted">
                    No pudimos cargar más artículos. Inténtalo de nuevo.
                  </p>
                )}
                <Button
                  size="md"
                  variant="secondary"
                  onClick={loadMore}
                  disabled={more === 'loading'}
                >
                  {more === 'loading' ? 'Cargando…' : 'Cargar más'}
                </Button>
              </div>
            )}
          </>
        )}
      </PageContainer>
      <BottomNav activeTo="/feed" />
    </div>
  )
}
