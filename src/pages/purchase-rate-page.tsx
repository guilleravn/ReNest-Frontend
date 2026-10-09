import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, CircleCheck, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StarRating } from '@/components/ui/star-rating'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { getReservation, rateSeller, type ReservationDetail } from '@/lib/reservations'
import type { PurchaseThanksState } from '@/pages/purchase-thanks-page'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'already-rated' }
  | { status: 'ready'; purchase: ReservationDetail }

/**
 * Rates the seller with 1 to 5 stars, once, after reception (PUR-8). It can be
 * skipped and stays available from the recap (PUR-9).
 */
export function PurchaseRatePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [stars, setStars] = useState(0)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let current = true
    getReservation(id).then(
      (purchase) =>
        current &&
        // Only the buyer rates; the seller sees a sale, not a purchase.
        setState(
          purchase.viewerRole === 'BUYER'
            ? { status: 'ready', purchase }
            : { status: 'not-found' },
        ),
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

  async function submit(event: FormEvent, purchase: ReservationDetail) {
    event.preventDefault()
    if (stars === 0 || saving) return
    setSaving(true)
    setFailed(false)
    try {
      await rateSeller(purchase.id, stars)
      navigate(`/purchases/${purchase.id}/thanks`, {
        replace: true,
        state: { sellerName: purchase.counterpart.fullName, rated: true } satisfies PurchaseThanksState,
      })
    } catch (error) {
      setSaving(false)
      const code = error instanceof ApiError ? error.code : null
      if (code === ErrorCode.ALREADY_RATED) {
        setState({ status: 'already-rated' })
      } else if (code === ErrorCode.RECEPTION_NOT_CONFIRMED) {
        // Retrying can't fix it: the recap shows what is still pending.
        navigate(`/purchases/${purchase.id}`, { replace: true })
      } else if (code !== ErrorCode.UNAUTHORIZED) {
        // A 401 needs nothing here: the expired session already sends the user to login.
        setFailed(true)
      }
    }
  }

  const purchase = state.status === 'ready' ? state.purchase : null

  // Not received yet, or already rated (PUR-8): back to the recap.
  if (purchase && !purchase.actions.canRate) {
    return <Navigate to={`/purchases/${purchase.id}`} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={`/purchases/${id}`} />
      <PageContainer width="narrow" bottomSpace={purchase ? 'actions' : 'default'}>
        {state.status === 'loading' && (
          <p role="status" className="py-16 text-center text-sm text-text-muted">
            Cargando…
          </p>
        )}

        {state.status === 'error' && (
          <EmptyState
            icon={<CircleAlert aria-hidden />}
            title="No pudimos cargar la compra"
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
            title="Esta compra no existe"
            description="Puede que el enlace esté mal escrito."
            action={
              <ButtonLink to="/purchases" size="md" variant="secondary">
                Ver mis compras
              </ButtonLink>
            }
          />
        )}

        {state.status === 'already-rated' && (
          <EmptyState
            icon={<CircleCheck aria-hidden />}
            title="Ya calificaste a este vendedor"
            description="La calificación se da una sola vez y no se puede cambiar."
            action={
              <ButtonLink to={`/purchases/${id}`} size="md" variant="secondary">
                Ver la compra
              </ButtonLink>
            }
          />
        )}

        {purchase && (
          <form
            id="rating-form"
            className="flex flex-col items-center gap-6 py-16"
            onSubmit={(event) => submit(event, purchase)}
          >
            <PageHeader
              align="center"
              overline="Califica al vendedor"
              title={`¿Cómo te fue con ${purchase.counterpart.fullName}?`}
              description="Tu calificación ayuda a otras personas a saber en quién confiar."
            />
            <StarRating value={stars} onChange={setStars} label="Califica al vendedor del 1 al 5" />
          </form>
        )}
      </PageContainer>

      {purchase && (
        <StickyActionBar>
          <div className="flex flex-col gap-2">
            <Button type="submit" form="rating-form" fullWidth disabled={stars === 0 || saving}>
              {saving ? 'Enviando…' : 'Enviar calificación'}
            </Button>
            <ButtonLink
              to={`/purchases/${purchase.id}/thanks`}
              replace
              state={{ sellerName: purchase.counterpart.fullName, rated: false } satisfies PurchaseThanksState}
              variant="ghost"
              fullWidth
            >
              Omitir por ahora
            </ButtonLink>
          </div>
        </StickyActionBar>
      )}

      {failed && (
        <ToastViewport>
          <Toast tone="error" onDismiss={() => setFailed(false)}>
            No pudimos enviar tu calificación. Inténtalo de nuevo.
          </Toast>
        </ToastViewport>
      )}
    </div>
  )
}
