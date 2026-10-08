import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bell, CircleAlert, PackageCheck, PackageOpen, Plus, Tags } from 'lucide-react'
import { BottomNav, DesktopNav, defaultNavItems } from '@/components/layout/app-nav'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ListingRow, ListingRowGrid } from '@/components/listing/listing-row'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedControl, SegmentedItem } from '@/components/ui/segmented-control'
import { conditionLabel, formatPrice } from '@/lib/format'
import { getMyListings, type ListingStatus, type MyListing } from '@/lib/listings'
import { usePendingSalesCount } from '@/lib/pending-sales'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; items: MyListing[] }

const TABS: { status: ListingStatus; label: string }[] = [
  { status: 'ACTIVE', label: 'Activos' },
  { status: 'PENDING', label: 'En proceso' },
  { status: 'COMPLETED', label: 'Completados' },
]

const EMPTY = {
  ACTIVE: {
    icon: <Tags aria-hidden />,
    title: 'No tienes artículos activos',
    description: 'Lo que publiques aparecerá aquí mientras nadie lo reserve.',
  },
  PENDING: {
    icon: <PackageOpen aria-hidden />,
    title: 'Nada pendiente por ahora',
    description: 'Cuando alguien reserve uno de tus artículos, lo verás aquí.',
  },
  COMPLETED: {
    icon: <PackageCheck aria-hidden />,
    title: 'Aún no tienes ventas completadas',
    description: 'Cuando confirmes una entrega, la venta quedará registrada aquí.',
  },
} as const

function parseTab(value: string | null): ListingStatus {
  return TABS.find((tab) => tab.status === value)?.status ?? 'ACTIVE'
}

/** Seller tabs: Activos, En proceso and Completados (SAL-1). */
export function ListingsPage() {
  const navItems = defaultNavItems(usePendingSalesCount())
  const [searchParams] = useSearchParams()
  const tab = parseTab(searchParams.get('status'))
  const [attempt, setAttempt] = useState(0)
  // Results are tagged with the request they answer, so a tab switch or a
  // retry shows the loading state until its own response arrives.
  const requestKey = `${tab}:${attempt}`
  const [result, setResult] = useState<{ key: string; state: State } | null>(null)
  const state: State = result?.key === requestKey ? result.state : { status: 'loading' }

  useEffect(() => {
    let current = true
    getMyListings(tab).then(
      (items) => current && setResult({ key: requestKey, state: { status: 'ready', items } }),
      () => current && setResult({ key: requestKey, state: { status: 'error' } }),
    )
    return () => {
      current = false
    }
  }, [tab, requestKey])

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader bordered={false} />
      <DesktopNav activeTo="/listings" items={navItems} />
      <PageContainer bottomSpace="nav" className="space-y-5">
        <PageHeader title="Mis artículos" />

        <nav aria-label="Estado de tus artículos">
          <SegmentedControl>
            {TABS.map(({ status, label }) => (
              <SegmentedItem key={status} to={`/listings?status=${status}`} active={status === tab}>
                {label}
              </SegmentedItem>
            ))}
          </SegmentedControl>
        </nav>

        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando tus artículos…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar tus artículos"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button size="md" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
                Reintentar
              </Button>
            }
          />
        )}

        {state.status === 'ready' && state.items.length === 0 && (
          <EmptyState
            {...EMPTY[tab]}
            action={
              tab === 'ACTIVE' ? (
                <ButtonLink to="/listings/new" size="md">
                  Publicar un artículo
                </ButtonLink>
              ) : undefined
            }
          />
        )}

        {state.status === 'ready' && state.items.length > 0 && (
          <ListingRowGrid>
            {state.items.map((item) => (
              <li key={item.listing.id}>
                <MyListingRow item={item} />
              </li>
            ))}
          </ListingRowGrid>
        )}
      </PageContainer>
      <FloatingActionButton to="/listings/new" icon={<Plus className="size-4" aria-hidden />}>
        Nuevo artículo
      </FloatingActionButton>
      <BottomNav activeTo="/listings" items={navItems} />
    </div>
  )
}

function MyListingRow({ item: { listing, reservation } }: { item: MyListing }) {
  const common = {
    title: listing.title,
    price: formatPrice(listing.priceCents),
    imageSrc: listing.coverPhotoUrl,
  }

  if (!reservation) {
    return (
      <ListingRow
        {...common}
        to={`/listings/${listing.id}`}
        status="Activo"
        statusTone="green"
        detail={`${listing.category.name} · ${conditionLabel(listing.condition)}`}
      />
    )
  }

  if (listing.status === 'PENDING') {
    return (
      <ListingRow
        {...common}
        to={`/sales/${reservation.id}`}
        variant="active"
        status="Recogida agendada"
        detail={`${reservation.buyer.fullName} · ${reservation.pickupOption.locationLabel}`}
        trailing={
          <Bell
            role="img"
            aria-label="Requiere tu atención"
            className="size-5 text-green-strong"
          />
        }
      />
    )
  }

  return (
    <ListingRow
      {...common}
      to={`/sales/${reservation.id}`}
      variant="completed"
      status="Completado"
      detail={`Vendido a ${reservation.buyer.fullName}`}
    />
  )
}
