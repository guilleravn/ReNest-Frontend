import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { BottomNav, DesktopNav, defaultNavItems } from '@/components/layout/app-nav'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ListingRow, ListingRowGrid } from '@/components/listing/listing-row'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedControl, SegmentedItem } from '@/components/ui/segmented-control'
import { formatPickupTime, formatPrice } from '@/lib/format'
import { usePendingSalesCount } from '@/lib/pending-sales'
import { getMyPurchases, type Purchase, type PurchaseStatus } from '@/lib/purchases'

/** The outcome of one request; `key` says which tab and attempt it answers. */
type Result =
  | { key: string; status: 'error' }
  | { key: string; status: 'ready'; purchases: Purchase[] }

/**
 * The buyer's purchases in two tabs: "Agendados" until the buyer confirms
 * reception, then "Completados" (PUR-1, PUR-2). The tab lives in the URL, so
 * going back from a recap returns to the same tab.
 */
export function PurchasesPage() {
  const navItems = defaultNavItems(usePendingSalesCount())
  const [params, setParams] = useSearchParams()
  const tab: PurchaseStatus = params.get('tab') === 'completed' ? 'COMPLETED' : 'IN_PROGRESS'
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  const requestKey = `${tab}:${attempt}`
  const state = result?.key === requestKey ? result : { status: 'loading' as const }

  useEffect(() => {
    let current = true
    getMyPurchases(tab).then(
      (purchases) => current && setResult({ key: requestKey, status: 'ready', purchases }),
      () => current && setResult({ key: requestKey, status: 'error' }),
    )
    return () => {
      current = false
    }
  }, [tab, requestKey])

  const selectTab = useCallback(
    (next: PurchaseStatus) =>
      setParams(next === 'COMPLETED' ? { tab: 'completed' } : {}, { replace: true }),
    [setParams],
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader bordered={false} />
      <DesktopNav activeTo="/purchases" items={navItems} />
      <PageContainer bottomSpace="nav" className="space-y-6">
        <PageHeader title="Recogidas y compras" />

        <SegmentedControl role="group" aria-label="Estado de mis compras">
          <SegmentedItem active={tab === 'IN_PROGRESS'} onClick={() => selectTab('IN_PROGRESS')}>
            Agendados
          </SegmentedItem>
          <SegmentedItem active={tab === 'COMPLETED'} onClick={() => selectTab('COMPLETED')}>
            Completados
          </SegmentedItem>
        </SegmentedControl>

        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando compras…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar tus compras"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button size="md" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
                Reintentar
              </Button>
            }
          />
        )}

        {state.status === 'ready' && state.purchases.length === 0 && (
          tab === 'IN_PROGRESS' ? (
            <EmptyState
              title="No tienes recogidas agendadas"
              description="Cuando agendes la recogida de un artículo, la verás aquí."
              action={
                <ButtonLink to="/feed" size="md" variant="secondary">
                  Ver artículos
                </ButtonLink>
              }
            />
          ) : (
            <EmptyState
              title="Aún no tienes compras completadas"
              description="Las compras aparecen aquí cuando confirmas que recogiste el artículo."
            />
          )
        )}

        {state.status === 'ready' && state.purchases.length > 0 && (
          <ListingRowGrid>
            {state.purchases.map(({ id, listing, pickupOption, sellerHandedOverAt, buyerReceivedAt }) => (
              <li key={id}>
                <ListingRow
                  to={`/purchases/${id}`}
                  title={listing.title}
                  price={formatPrice(listing.priceCents)}
                  imageSrc={listing.coverPhotoUrl}
                  variant={buyerReceivedAt ? 'completed' : 'active'}
                  status={
                    buyerReceivedAt
                      ? 'Completado'
                      : sellerHandedOverAt
                        ? 'El vendedor confirmó la entrega'
                        : 'Recogida agendada'
                  }
                  detail={`${pickupOption.locationLabel} · ${formatPickupTime(
                    pickupOption.weekdays,
                    pickupOption.startTime,
                    pickupOption.endTime,
                  )}`}
                />
              </li>
            ))}
          </ListingRowGrid>
        )}
      </PageContainer>
      <BottomNav activeTo="/purchases" items={navItems} />
    </div>
  )
}
