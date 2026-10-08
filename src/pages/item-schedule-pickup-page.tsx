import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { PickupSummaryCard } from '@/components/listing/pickup-summary-card'
import { ProductSummary } from '@/components/listing/product-summary'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { OptionCard, OptionCardGroup } from '@/components/ui/option-card'
import { PageHeader } from '@/components/ui/page-header'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { TrustNote } from '@/components/ui/trust-note'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { conditionLabel, formatPickupTime, formatPrice } from '@/lib/format'
import { getListing, type ListingDetail, type PickupOption } from '@/lib/listings'
import { mapsHref } from '@/lib/maps'
import { createReservation, type ReservationDetail } from '@/lib/reservations'
import { pickupMessage, whatsappHref } from '@/lib/whatsapp'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; listing: ListingDetail }
  | { status: 'reserved'; reservation: ReservationDetail }
  /** Someone else reserved it first (RES-5). */
  | { status: 'taken' }

const pickupTime = (option: PickupOption) =>
  formatPickupTime(option.weekdays, option.startTime, option.endTime)

export function ItemSchedulePickupPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    getListing(id).then(
      (listing) => {
        if (!current) return
        // Only an Active listing of someone else can be reserved (RES-4, GEN-10);
        // its detail page explains why not.
        if (listing.status !== 'ACTIVE' || listing.viewer.isSeller) {
          navigate(`/items/${listing.id}`, { replace: true })
          return
        }
        setState({ status: 'ready', listing })
      },
      (error: unknown) =>
        current &&
        setState({
          status: error instanceof ApiError && error.status === 404 ? 'not-found' : 'error',
        }),
    )
    return () => {
      current = false
    }
  }, [id, attempt, navigate])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  async function reserve() {
    if (!listing || !selected || submitting) return
    setSubmitting(true)
    setNotice(null)
    try {
      const reservation = await createReservation(listing.id, selected.id)
      setState({ status: 'reserved', reservation })
    } catch (error) {
      handleReserveError(error)
    } finally {
      setSubmitting(false)
      setConfirming(false)
    }
  }

  // A 401 needs nothing here: the expired session already sends the user to login.
  function handleReserveError(error: unknown) {
    const code = error instanceof ApiError ? error.code : null
    if (code === ErrorCode.LISTING_NOT_AVAILABLE) {
      setState({ status: 'taken' })
    } else if (code === ErrorCode.INVALID_PICKUP_OPTION) {
      // The seller changed the pairs since the page loaded.
      setNotice('Ese lugar y horario ya no está disponible. Elige otro.')
      setSelectedId(null)
      retry()
    } else if (code === ErrorCode.CANNOT_RESERVE_OWN_LISTING) {
      navigate(`/items/${id}`, { replace: true })
    } else if (code === ErrorCode.LISTING_NOT_FOUND) {
      setState({ status: 'not-found' })
    } else if (code !== ErrorCode.UNAUTHORIZED) {
      setNotice('No pudimos confirmar la reserva. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  const listing = state.status === 'ready' ? state.listing : null
  const selected = listing?.pickupOptions.find((option) => option.id === selectedId) ?? null

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={state.status === 'reserved' ? '/feed' : `/items/${id}`} />
      <PageContainer width="narrow" bottomSpace={listing ? 'actions' : 'default'} className="space-y-6">
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando…
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
          <>
            <PageHeader
              overline="Agendar recogida"
              title="Elige dónde y cuándo"
              description="Elige uno de los lugares y horarios del vendedor."
            />
            <ProductSummary
              overline={`${listing.category.name} · ${conditionLabel(listing.condition)}`}
              title={listing.title}
              price={formatPrice(listing.priceCents)}
            />
            {notice && (
              <div role="alert">
                <InfoPanel>{notice}</InfoPanel>
              </div>
            )}
            <OptionCardGroup role="radiogroup" aria-label="Lugares y horarios de recogida">
              {listing.pickupOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={option.id === selectedId}
                  onClick={() => setSelectedId(option.id)}
                >
                  <span className="block font-medium">{option.locationLabel}</span>
                  <span className="block text-text-muted">{pickupTime(option)}</span>
                </OptionCard>
              ))}
            </OptionCardGroup>
            <TrustNote>El día exacto lo acuerdas con el vendedor por WhatsApp.</TrustNote>
          </>
        )}

        {state.status === 'taken' && (
          <EmptyState
            icon={<PackageX aria-hidden />}
            title="Este artículo acaba de ser reservado"
            description="Otra persona lo confirmó un momento antes que tú. No se creó ninguna reserva para ti."
            action={
              <ButtonLink to="/feed" size="md" variant="secondary">
                Ver más productos
              </ButtonLink>
            }
          />
        )}

        {state.status === 'reserved' && <ReservedSummary reservation={state.reservation} />}
      </PageContainer>

      {listing && (
        <StickyActionBar note={selected ? undefined : 'Elige un lugar y horario para continuar.'}>
          <Button fullWidth disabled={!selected} onClick={() => setConfirming(true)}>
            Confirmar recogida
          </Button>
        </StickyActionBar>
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="¿Confirmar la recogida?"
        description="El artículo quedará reservado para ti. Una vez confirmada, la reserva no se puede cancelar."
        confirmLabel="Sí, reservar"
        onConfirm={reserve}
        pending={submitting}
      >
        {selected && <InfoPanel title={selected.locationLabel}>{pickupTime(selected)}</InfoPanel>}
      </ConfirmDialog>
    </div>
  )
}

function ReservedSummary({ reservation }: { reservation: ReservationDetail }) {
  const { listing, pickupOption, counterpart: seller } = reservation

  return (
    <>
      <PageHeader
        overline="Recogida agendada"
        title="¡Listo, es tuyo!"
        description="Escríbele al vendedor para acordar el día exacto. Encontrarás esta reserva en Mis compras."
      />
      <ProductSummary title={listing.title} price={formatPrice(listing.priceCents)} />
      <PickupSummaryCard
        personRole="Vendedor"
        personName={seller.fullName}
        personAvatarSrc={seller.avatarUrl ?? undefined}
        personVerified={seller.isVerified}
        pickupPlace={pickupOption.locationLabel}
        pickupTime={pickupTime(pickupOption)}
        whatsappHref={whatsappHref(
          seller.phoneE164,
          pickupMessage(seller.fullName, listing.title, pickupOption.locationLabel),
        )}
        mapHref={mapsHref(pickupOption.locationLabel)}
      />
      <ButtonLink to="/feed" variant="secondary" fullWidth>
        Ver más productos
      </ButtonLink>
    </>
  )
}
