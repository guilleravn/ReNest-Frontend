import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, CircleCheck, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ProductSummary } from '@/components/listing/product-summary'
import { Button, ButtonLink } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField } from '@/components/ui/form-field'
import { Textarea } from '@/components/ui/input'
import { OptionCard, OptionCardGroup } from '@/components/ui/option-card'
import { PageHeader } from '@/components/ui/page-header'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { conditionLabel, formatPrice } from '@/lib/format'
import { confirmReception, getReservation, type ReservationDetail } from '@/lib/reservations'

const REPORT_MAX_LENGTH = 1000

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'already-confirmed' }
  | { status: 'ready'; purchase: ReservationDetail }

const ITEMS = [
  { key: 'matchesListing', label: 'El artículo coincide con las fotos y la descripción' },
  { key: 'worksNoUndisclosedDamage', label: 'Funciona / sin daños no informados' },
  { key: 'allPartsIncluded', label: 'Incluye todas las partes y accesorios' },
] as const

type ItemKey = (typeof ITEMS)[number]['key']

/**
 * Reception checklist (PUR-5). Unchecked items are sent as `false` and don't
 * block the confirmation (PUR-6); only "Tengo el artículo conmigo ahora" does.
 * It can be confirmed once (PUR-7), then the buyer goes on to rate.
 */
export function PurchaseChecklistPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Record<ItemKey, boolean>>({
    matchesListing: false,
    worksNoUndisclosedDamage: false,
    allPartsIncluded: false,
  })
  const [hasItemNow, setHasItemNow] = useState(false)
  const [report, setReport] = useState('')
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let current = true
    getReservation(id).then(
      (purchase) => current && setState({ status: 'ready', purchase }),
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
    if (!hasItemNow || saving) return
    setSaving(true)
    setFailed(false)
    try {
      await confirmReception(purchase.id, { ...answers, issueReport: report.trim() || null })
      navigate(`/purchases/${purchase.id}/rate`, { replace: true })
    } catch (error) {
      setSaving(false)
      const code = error instanceof ApiError ? error.code : null
      if (code === ErrorCode.RECEPTION_ALREADY_CONFIRMED) {
        setState({ status: 'already-confirmed' })
      } else if (code !== ErrorCode.UNAUTHORIZED) {
        // A 401 needs nothing here: the expired session already sends the user to login.
        setFailed(true)
      }
    }
  }

  const purchase = state.status === 'ready' ? state.purchase : null

  // Only the buyer confirms reception; the seller has their own view of the same reservation.
  if (purchase?.viewerRole === 'SELLER') {
    return <Navigate to={`/sales/${purchase.id}`} replace />
  }

  // Reception can't be changed once confirmed (PUR-7): back to the recap.
  if (purchase && !purchase.actions.canConfirmReception) {
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

        {state.status === 'already-confirmed' && (
          <EmptyState
            icon={<CircleCheck aria-hidden />}
            title="Ya confirmaste la recepción"
            description="La recepción se confirma una sola vez y no se puede cambiar."
            action={
              <ButtonLink to={`/purchases/${id}`} size="md" variant="secondary">
                Ver la compra
              </ButtonLink>
            }
          />
        )}

        {purchase && (
          <form
            id="reception-form"
            className="space-y-6"
            onSubmit={(event) => submit(event, purchase)}
          >
            <PageHeader
              overline="Lista de recepción"
              title="¿Cómo recibiste el artículo?"
              description="Revísalo antes de confirmar. Después no podrás cambiar tus respuestas."
            />

            <div className="flex items-start gap-4">
              <img
                src={purchase.listing.coverPhotoUrl}
                alt={purchase.listing.title}
                className="aspect-square w-20 shrink-0 rounded-xl bg-surface-sunken object-cover"
              />
              <ProductSummary
                className="min-w-0"
                title={purchase.listing.title}
                price={formatPrice(purchase.listing.priceCents)}
                meta={`${purchase.listing.category.name} · ${conditionLabel(purchase.listing.condition)}`}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Marca lo que se cumple</p>
              <OptionCardGroup role="group" aria-label="Marca lo que se cumple">
                {ITEMS.map((item) => (
                  <OptionCard
                    key={item.key}
                    indicator="checkbox"
                    selected={answers[item.key]}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                  >
                    {item.label}
                  </OptionCard>
                ))}
              </OptionCardGroup>
            </div>

            <FormField
              label="¿Algo que quieras reportar?"
              aside="Opcional"
              htmlFor="issue-report"
              hint={`${report.length}/${REPORT_MAX_LENGTH}`}
            >
              <Textarea
                id="issue-report"
                value={report}
                maxLength={REPORT_MAX_LENGTH}
                placeholder="Por ejemplo: la pantalla tiene un rayón que no estaba en las fotos."
                onChange={(event) => setReport(event.target.value)}
              />
            </FormField>

            <Checkbox
              className="rounded-xl border border-border p-4 font-medium text-foreground"
              checked={hasItemNow}
              onChange={(event) => setHasItemNow(event.target.checked)}
            >
              Tengo el artículo conmigo ahora
            </Checkbox>
          </form>
        )}
      </PageContainer>

      {purchase && (
        <StickyActionBar
          note={hasItemNow ? undefined : 'Marca “Tengo el artículo conmigo ahora” para continuar.'}
        >
          <Button type="submit" form="reception-form" fullWidth disabled={!hasItemNow || saving}>
            {saving ? 'Confirmando…' : 'Confirmar recepción'}
          </Button>
        </StickyActionBar>
      )}

      {failed && (
        <ToastViewport>
          <Toast tone="error" onDismiss={() => setFailed(false)}>
            No pudimos confirmar la recepción. Inténtalo de nuevo.
          </Toast>
        </ToastViewport>
      )}
    </div>
  )
}
