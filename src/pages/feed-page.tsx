import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { BottomNav, DesktopNav, defaultNavItems } from '@/components/layout/app-nav'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ProductCard, ProductGrid } from '@/components/listing/product-card'
import { Button } from '@/components/ui/button'
import { Chip, ChipGroup } from '@/components/ui/chip'
import { EmptyState } from '@/components/ui/empty-state'
import { Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { useAuth } from '@/lib/auth-context'
import type { City } from '@/lib/auth'
import { CITY_OPTIONS, cityLabel, isCity } from '@/lib/cities'
import { usePendingSalesCount } from '@/lib/pending-sales'
import { conditionLabel, conditionTone, formatPrice } from '@/lib/format'
import {
  getCategories,
  getFeed,
  type Category,
  type ListingCard,
} from '@/lib/listings'

/** The API searches from 2 characters (BRW-2); shorter text lists everything. */
const MIN_SEARCH_LENGTH = 2
const MAX_SEARCH_LENGTH = 60
const SEARCH_DEBOUNCE_MS = 300
/** `?city=all` keeps every city even for a logged-in user (BRW-11). */
const ALL_CITIES = 'all'

/** The outcome of one request; `key` says which search, filters and attempt it answers. */
type Result =
  | { key: string; status: 'error' }
  | { key: string; status: 'ready'; listings: ListingCard[]; nextCursor: string | null }

type More = { key: string; status: 'loading' | 'error' }

/** The search that actually runs: text under 2 characters doesn't search. */
function searchTerm(text: string): string {
  const term = text.trim()
  return term.length >= MIN_SEARCH_LENGTH ? term : ''
}

/**
 * The city to filter by: '' for every city, null while it depends on a user
 * that is loading or failed to load. A city the URL doesn't name (or names
 * wrongly) is the user's own; anonymous visitors see every city (BRW-11).
 */
function cityFilter(param: string | null, auth: ReturnType<typeof useAuth>): City | '' | null {
  if (param === ALL_CITIES) return ''
  if (isCity(param)) return param
  if (auth.status === 'loading' || auth.status === 'error') return null
  return auth.user?.city ?? ''
}

/**
 * Public feed: Active listings, newest first, 20 at a time, with title search,
 * a category filter and a city filter that combine (BRW-1..3, BRW-10, BRW-11,
 * GEN-5). The filters live in the URL, so going back from a listing keeps them.
 */
export function FeedPage() {
  const navItems = defaultNavItems(usePendingSalesCount())
  const auth = useAuth()
  const [params, setParams] = useSearchParams()
  const q = searchTerm(params.get('q') ?? '')
  const category = params.get('category') ?? ''
  const city = cityFilter(params.get('city'), auth)
  const hasFilters = Boolean(q || category)

  const [text, setText] = useState(q)
  const [syncedQ, setSyncedQ] = useState(q)
  // The URL changed from outside (the "Inicio" link, back/forward): the box
  // follows it, or the debounce would write the old search back.
  if (q !== syncedQ) {
    setSyncedQ(q)
    if (searchTerm(text) !== q) setText(q)
  }
  const [categories, setCategories] = useState<Category[]>([])
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [more, setMore] = useState<More | null>(null)

  // Anything not answering the current request is shown as loading. A user
  // that failed to load has no city yet: that is an error, not every city.
  const requestKey = `${q}\n${category}\n${city}\n${attempt}`
  const sessionFailed = city === null && auth.status === 'error'
  const state = sessionFailed
    ? { status: 'error' as const }
    : result?.key === requestKey
      ? result
      : { status: 'loading' as const }
  const moreStatus = more?.key === requestKey ? more.status : 'idle'

  /** Sets or removes (empty string) the given filters, keeping the others. */
  const setFilters = useCallback(
    (next: { q?: string; category?: string; city?: string }) =>
      setParams(
        (prev) => {
          const search = new URLSearchParams(prev)
          for (const [name, value] of Object.entries(next)) {
            if (value) search.set(name, value)
            else search.delete(name)
          }
          return search
        },
        { replace: true },
      ),
    [setParams],
  )

  useEffect(() => {
    let current = true
    getCategories().then(
      (list) => current && setCategories(list),
      // The chips are optional: without them the feed still works.
      () => {},
    )
    return () => {
      current = false
    }
  }, [])

  // Runs the search a moment after typing stops.
  useEffect(() => {
    const term = searchTerm(text)
    if (term === q) return
    const timer = setTimeout(() => setFilters({ q: term }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text, q, setFilters])

  const query = { q: q || undefined, category: category || undefined, city: city || undefined }

  useEffect(() => {
    // Until the user loads, their city is unknown: wait rather than list every city.
    if (city === null) return
    let current = true
    getFeed({ q: q || undefined, category: category || undefined, city: city || undefined }).then(
      (page) =>
        current &&
        setResult({
          key: requestKey,
          status: 'ready',
          listings: page.data,
          nextCursor: page.nextCursor,
        }),
      () => current && setResult({ key: requestKey, status: 'error' }),
    )
    return () => {
      current = false
    }
  }, [q, category, city, requestKey])

  function loadMore() {
    if (state.status !== 'ready' || !state.nextCursor) return
    const key = requestKey
    setMore({ key, status: 'loading' })
    getFeed({ ...query, cursor: state.nextCursor }).then(
      (page) => {
        // A page for filters that changed meanwhile is dropped.
        setResult((prev) =>
          prev?.key === key && prev.status === 'ready'
            ? { ...prev, listings: [...prev.listings, ...page.data], nextCursor: page.nextCursor }
            : prev,
        )
        setMore((prev) => (prev?.key === key ? null : prev))
      },
      () => setMore((prev) => (prev?.key === key ? { key, status: 'error' } : prev)),
    )
  }

  /** Clears the search and the category; the city stays, it has its own "all". */
  function clearFilters() {
    setText('')
    setFilters({ q: '', category: '' })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader bordered={false} />
      <DesktopNav activeTo="/feed" items={navItems} />
      <PageContainer bottomSpace="nav" className="space-y-6">
        <PageHeader title="Encuentra algo de segunda mano" />

        <div className="space-y-3">
          <SearchInput
            aria-label="Buscar por título"
            placeholder="Buscar por título"
            maxLength={MAX_SEARCH_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onClear={() => {
              setText('')
              setFilters({ q: '' })
            }}
          />
          <Select
            aria-label="Ubicación"
            className="sm:w-64"
            value={city === '' ? ALL_CITIES : (city ?? '')}
            disabled={city === null}
            onChange={(event) => setFilters({ city: event.target.value })}
          >
            <option value={ALL_CITIES}>Todas las ubicaciones</option>
            {CITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {categories.length > 0 && (
            <ChipGroup role="group" aria-label="Categorías">
              <Chip selected={!category} onClick={() => setFilters({ category: '' })}>
                Todas
              </Chip>
              {categories.map(({ slug, name }) => (
                <Chip
                  key={slug}
                  selected={category === slug}
                  onClick={() => setFilters({ category: slug })}
                >
                  {name}
                </Chip>
              ))}
            </ChipGroup>
          )}
        </div>

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
              <Button
                size="md"
                variant="secondary"
                onClick={() => (sessionFailed ? auth.retry() : setAttempt((n) => n + 1))}
              >
                Reintentar
              </Button>
            }
          />
        )}

        {state.status === 'ready' && state.listings.length === 0 && (
          hasFilters ? (
            <EmptyState
              title="No encontramos artículos"
              description="Prueba con otras palabras o con otra categoría."
              action={
                <Button size="md" variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : city ? (
            <EmptyState
              title={`No hay artículos en ${cityLabel(city)}`}
              description="Mira lo que se publica en otras ciudades."
              action={
                <Button size="md" variant="secondary" onClick={() => setFilters({ city: ALL_CITIES })}>
                  Ver todas las ubicaciones
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Todavía no hay artículos"
              description="Vuelve pronto: cada día se publican cosas nuevas."
            />
          )
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
                {moreStatus === 'error' && (
                  <p role="alert" className="text-sm text-text-muted">
                    No pudimos cargar más artículos. Inténtalo de nuevo.
                  </p>
                )}
                <Button
                  size="md"
                  variant="secondary"
                  onClick={loadMore}
                  disabled={moreStatus === 'loading'}
                >
                  {moreStatus === 'loading' ? 'Cargando…' : 'Cargar más'}
                </Button>
              </div>
            )}
          </>
        )}
      </PageContainer>
      <BottomNav activeTo="/feed" items={navItems} />
    </div>
  )
}
