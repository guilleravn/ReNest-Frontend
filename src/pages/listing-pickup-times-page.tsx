import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX, Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { PickupOptionSheet } from '@/components/listing/pickup-option-sheet'
import { PickupSlotItem, PickupSlotList } from '@/components/listing/pickup-slot-item'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { PageHeader } from '@/components/ui/page-header'
import { TextLink } from '@/components/ui/text-link'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { formatPickupTime } from '@/lib/format'
import { MAX_PICKUP_OPTIONS, type PickupOptionDraft } from '@/lib/listing-form'
import {
  addPickupOption,
  getListing,
  removePickupOption,
  type ListingDetail,
  type PickupOption,
} from '@/lib/listings'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'not-owner' }
  | { status: 'not-editable' }
  // `load` counts the fetches, so a reload remounts the editor with fresh pairs.
  | { status: 'ready'; listing: ListingDetail; load: number }

type Notice = { tone: 'success' | 'error'; text: string }

/** "Configurar mis horarios": add or remove the pickup pairs of an Active listing (SAL-6, C2). */
export function ListingPickupTimesPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  // Held here, so a notice outlives the editor's remount on reload.
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    let current = true
    getListing(id).then(
      (listing) => {
        if (!current) return
        if (!listing.viewer.isSeller) setState({ status: 'not-owner' })
        else if (!listing.viewer.canEdit) setState({ status: 'not-editable' })
        else setState({ status: 'ready', listing, load: attempt })
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
  }, [id, attempt])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  // Someone else's listing: show it as any buyer sees it.
  if (state.status === 'not-owner') return <Navigate to={`/items/${id}`} replace />

  return (
    <>
      {state.status === 'ready' ? (
        <PickupTimesEditor
          key={state.load}
          listing={state.listing}
          onNotice={setNotice}
          onReload={() => setAttempt((n) => n + 1)}
          onNotEditable={() => setState({ status: 'not-editable' })}
          onNotFound={() => setState({ status: 'not-found' })}
          onNotOwner={() => setState({ status: 'not-owner' })}
        />
      ) : (
        <PageStatus state={state} id={id} onRetry={retry} />
      )}

      {notice && (
        <ToastViewport>
          <Toast tone={notice.tone} onDismiss={() => setNotice(null)}>
            {notice.text}
          </Toast>
        </ToastViewport>
      )}
    </>
  )
}

type PageStatusProps = {
  state: Exclude<State, { status: 'ready' } | { status: 'not-owner' }>
  id: string
  onRetry: () => void
}

/** Loading, error, not-found and not-editable states. */
function PageStatus({ state, id, onRetry }: PageStatusProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={`/listings/${id}`} />
      <PageContainer width="narrow">
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
              <Button size="md" variant="secondary" onClick={onRetry}>
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

        {state.status === 'not-editable' && (
          <InfoPanel title="Ya no puedes cambiar los horarios">
            Alguien ya reservó este artículo con uno de tus horarios.{' '}
            <TextLink to="/listings">Ver mis artículos</TextLink>
          </InfoPanel>
        )}
      </PageContainer>
    </div>
  )
}

type PickupTimesEditorProps = {
  listing: ListingDetail
  onNotice: (notice: Notice) => void
  /** Reloads the listing, e.g. when its pairs changed elsewhere. */
  onReload: () => void
  onNotEditable: () => void
  onNotFound: () => void
  onNotOwner: () => void
}

function PickupTimesEditor({
  listing,
  onNotice: setNotice,
  onReload,
  onNotEditable,
  onNotFound,
  onNotOwner,
}: PickupTimesEditorProps) {
  const [options, setOptions] = useState<PickupOption[]>(listing.pickupOptions)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<PickupOption | null>(null)
  const [pendingRemove, setPendingRemove] = useState(false)

  const atMax = options.length >= MAX_PICKUP_OPTIONS
  const atMin = options.length <= 1

  /** Handles the errors both actions share; returns false when it handled none. */
  function handleSharedError(apiError: ApiError | null): boolean {
    switch (apiError?.code) {
      case ErrorCode.LISTING_NOT_EDITABLE:
        onNotEditable()
        return true
      case ErrorCode.LISTING_NOT_FOUND:
        onNotFound()
        return true
      case ErrorCode.NOT_LISTING_OWNER:
        onNotOwner()
        return true
      // The pairs changed elsewhere (another tab): show the current ones.
      case ErrorCode.PICKUP_OPTION_LIMIT:
      case ErrorCode.LAST_PICKUP_OPTION:
      case ErrorCode.PICKUP_OPTION_NOT_FOUND:
        onReload()
        setNotice({ tone: 'error', text: 'Tus horarios cambiaron. Te mostramos los actuales.' })
        return true
      // The expired session already sends the user to login.
      case ErrorCode.UNAUTHORIZED:
        return true
      default:
        return false
    }
  }

  /** Resolves to a message the sheet shows while it stays open, or nothing to close it. */
  async function add(option: PickupOptionDraft): Promise<string | void> {
    try {
      const added = await addPickupOption(listing.id, option)
      setOptions((prev) => [...prev, added])
      setNotice({ tone: 'success', text: 'Opción de entrega agregada' })
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      if (apiError?.code === ErrorCode.VALIDATION_ERROR) return 'Revisa los datos de la opción.'
      // Handled errors close the sheet: what it would add no longer applies.
      if (handleSharedError(apiError)) return
      return 'No pudimos agregar la opción. Inténtalo de nuevo.'
    }
  }

  async function remove() {
    if (!removing) return
    setPendingRemove(true)
    try {
      await removePickupOption(listing.id, removing.id)
      setOptions((prev) => prev.filter((option) => option.id !== removing.id))
      setNotice({ tone: 'success', text: 'Opción de entrega quitada' })
    } catch (error) {
      if (!handleSharedError(error instanceof ApiError ? error : null)) {
        setNotice({ tone: 'error', text: 'No pudimos quitar la opción. Inténtalo de nuevo.' })
      }
    } finally {
      setPendingRemove(false)
      setRemoving(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={`/listings/${listing.id}`} />
      <PageContainer width="narrow" className="space-y-6">
        <PageHeader
          overline={listing.title}
          title="Mis horarios de recogida"
          description={`Ten de 1 a ${MAX_PICKUP_OPTIONS} opciones de lugar y horario. El comprador elegirá una.`}
        />

        <section aria-label="Opciones de entrega" className="space-y-2">
          <PickupSlotList>
            {options.map((option) => (
              <PickupSlotItem
                key={option.id}
                place={option.locationLabel}
                time={formatPickupTime(option.weekdays, option.startTime, option.endTime)}
                onRemove={() => setRemoving(option)}
                removeDisabled={atMin}
              />
            ))}
          </PickupSlotList>
          {atMin && (
            <p className="text-xs text-text-subtle">
              Necesitas al menos una opción. Agrega otra antes de quitar esta.
            </p>
          )}
        </section>

        <div className="space-y-2">
          <Button variant="outline" fullWidth disabled={atMax} onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            Agregar horario y lugar
          </Button>
          {atMax && (
            <p className="text-center text-xs text-text-subtle">
              Ya tienes el máximo de {MAX_PICKUP_OPTIONS} opciones. Quita una para agregar otra.
            </p>
          )}
        </div>

        <p className="text-xs text-text-muted">
          Para cambiar una opción, quítala y agrega una nueva. Los cambios se guardan al instante.
        </p>
      </PageContainer>

      <PickupOptionSheet open={adding} onOpenChange={setAdding} onAdd={add} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="¿Quitar esta opción?"
        // Place and time, so two pairs at the same place can be told apart.
        description={
          removing &&
          `${removing.locationLabel}, ${formatPickupTime(removing.weekdays, removing.startTime, removing.endTime)}`
        }
        confirmLabel="Sí, quitar"
        cancelLabel="Cancelar"
        pending={pendingRemove}
        onConfirm={remove}
      />
    </div>
  )
}
