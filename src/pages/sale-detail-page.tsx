import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { PickupSummaryCard } from '@/components/listing/pickup-summary-card'
import { ProductSummary } from '@/components/listing/product-summary'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { conditionLabel, formatDate, formatPickupTime, formatPrice } from '@/lib/format'
import { mapsHref } from '@/lib/maps'
import { confirmHandover, getReservation, type ReservationDetail } from '@/lib/reservations'
import { saleMessage, whatsappHref } from '@/lib/whatsapp'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; sale: ReservationDetail }

type Notice = { tone: 'success' | 'error'; text: string }

/** A Pending or Completed listing as its seller sees it (SAL-3, SAL-4, SAL-5). */
export function SaleDetailPage() {
  const { reservationId = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    let current = true
    getReservation(reservationId).then(
      (sale) => current && setState({ status: 'ready', sale }),
      (error: unknown) =>
        current &&
        setState({
          status: error instanceof ApiError && error.status === 404 ? 'not-found' : 'error',
        }),
    )
    return () => {
      current = false
    }
  }, [reservationId, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  async function handOver(sale: ReservationDetail) {
    setSaving(true)
    setNotice(null)
    try {
      await confirmHandover(sale.id)
      navigate(`/listings/${sale.listing.id}/sale-completed`)
    } catch (error) {
      setSaving(false)
      setConfirming(false)
      const code = error instanceof ApiError ? error.code : null
      if (code === ErrorCode.HANDOVER_ALREADY_CONFIRMED) {
        setNotice({ tone: 'success', text: 'Ya habías confirmado esta entrega.' })
        // Reload in place so the sale shows as completed.
        setAttempt((n) => n + 1)
      } else if (code !== ErrorCode.UNAUTHORIZED) {
        // A 401 needs nothing here: the expired session already sends the user to login.
        setNotice({ tone: 'error', text: 'No pudimos confirmar la entrega. Inténtalo de nuevo.' })
      }
    }
  }

  const sale = state.status === 'ready' ? state.sale : null

  // The buyer has their own recap of the same reservation.
  if (sale?.viewerRole === 'BUYER') {
    return <Navigate to={`/purchases/${sale.id}`} replace />
  }

  const isPending = sale?.listing.status === 'PENDING'
  const canConfirmHandover = sale?.actions.canConfirmHandover ?? false

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={sale ? `/listings?status=${sale.listing.status}` : '/listings'} />
      <PageContainer width="narrow" bottomSpace={canConfirmHandover ? 'actions' : 'default'}>
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando venta…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar la venta"
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
            title="Esta venta no existe"
            description="Puede que el enlace esté mal escrito."
            action={
              <ButtonLink to="/listings" size="md" variant="secondary">
                Ver mis artículos
              </ButtonLink>
            }
          />
        )}

        {sale && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <img
                src={sale.listing.coverPhotoUrl}
                alt={sale.listing.title}
                className="aspect-square w-24 shrink-0 rounded-xl bg-surface-sunken object-cover"
              />
              <ProductSummary
                className="min-w-0"
                overline={isPending ? 'Recogida agendada' : 'Venta completada'}
                title={sale.listing.title}
                price={formatPrice(sale.listing.priceCents)}
                meta={`${sale.listing.category.name} · ${conditionLabel(sale.listing.condition)}`}
              />
            </div>

            <section aria-label="Comprador">
              <PickupSummaryCard
                personRole="Comprador"
                personName={sale.counterpart.fullName}
                personAvatarSrc={sale.counterpart.avatarUrl ?? undefined}
                personVerified={sale.counterpart.isVerified}
                pickupPlace={sale.pickupOption.locationLabel}
                pickupTime={formatPickupTime(
                  sale.pickupOption.weekdays,
                  sale.pickupOption.startTime,
                  sale.pickupOption.endTime,
                )}
                whatsappHref={
                  isPending
                    ? whatsappHref(
                        sale.counterpart.phoneE164,
                        saleMessage(sale.counterpart.fullName, sale.listing.title),
                      )
                    : undefined
                }
                mapHref={isPending ? mapsHref(sale.pickupOption.locationLabel) : undefined}
              />
            </section>

            <InfoPanel title="Registro de la venta">
              <dl className="mt-2 grid gap-1">
                <div className="flex justify-between gap-4">
                  <dt>Reservado el</dt>
                  <dd className="font-medium text-foreground">{formatDate(sale.reservedAt)}</dd>
                </div>
                {sale.sellerHandedOverAt && (
                  <div className="flex justify-between gap-4">
                    <dt>Entregado el</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(sale.sellerHandedOverAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </InfoPanel>
          </div>
        )}
      </PageContainer>

      {sale && canConfirmHandover && (
        <>
          <StickyActionBar>
            <Button fullWidth onClick={() => setConfirming(true)}>
              Confirmar entrega
            </Button>
          </StickyActionBar>
          <ConfirmDialog
            open={confirming}
            onOpenChange={setConfirming}
            title="¿Confirmar la entrega?"
            description="Hazlo solo cuando el comprador ya tenga el artículo. El artículo pasará a Completados."
            confirmLabel="Sí, ya lo entregué"
            pending={saving}
            onConfirm={() => handOver(sale)}
          />
        </>
      )}

      {notice && (
        <ToastViewport>
          <Toast tone={notice.tone} onDismiss={() => setNotice(null)}>
            {notice.text}
          </Toast>
        </ToastViewport>
      )}
    </div>
  )
}
