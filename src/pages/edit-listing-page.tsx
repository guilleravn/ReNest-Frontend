import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ListingDetailsForm } from '@/components/listing/listing-details-form'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { InfoPanel } from '@/components/ui/info-panel'
import { PageHeader } from '@/components/ui/page-header'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { TextLink } from '@/components/ui/text-link'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import { detailsFieldOf, toListingDetailsValues, toListingUpdate } from '@/lib/listing-form'
import { getListing, updateListing, type ListingDetail } from '@/lib/listings'
import { useCategories } from '@/lib/use-categories'
import { useListingDetailsForm } from '@/lib/use-listing-details-form'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'not-owner' }
  | { status: 'not-editable' }
  | { status: 'ready'; listing: ListingDetail }

/** Edit an Active listing's details and photos (C3, LST-11..13). */
export function EditListingPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getListing(id).then(
      (listing) => {
        if (!current) return
        if (!listing.viewer.isSeller) setState({ status: 'not-owner' })
        else if (!listing.viewer.canEdit) setState({ status: 'not-editable' })
        else setState({ status: 'ready', listing })
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

  if (state.status === 'ready') {
    return (
      <EditListingForm
        listing={state.listing}
        onNotEditable={() => setState({ status: 'not-editable' })}
        onNotFound={() => setState({ status: 'not-found' })}
        onNotOwner={() => setState({ status: 'not-owner' })}
      />
    )
  }

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

        {state.status === 'not-editable' && (
          <InfoPanel title="Ya no puedes editar este artículo">
            Alguien ya lo reservó, así que se queda tal como lo vio.{' '}
            <TextLink to="/listings">Ver mis artículos</TextLink>
          </InfoPanel>
        )}
      </PageContainer>
    </div>
  )
}

type EditListingFormProps = {
  listing: ListingDetail
  onNotEditable: () => void
  onNotFound: () => void
  onNotOwner: () => void
}

function EditListingForm({ listing, onNotEditable, onNotFound, onNotOwner }: EditListingFormProps) {
  const details = useListingDetailsForm(toListingDetailsValues(listing))
  const categories = useCategories()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const navigate = useNavigate()

  // Toasts sit over the action bar, so they leave on their own.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  async function save() {
    if (!details.validate()) return
    setSaving(true)
    try {
      await updateListing(listing.id, toListingUpdate(details.values))
      // My Listings shows the notice from the router state.
      navigate('/listings', { replace: true, state: { notice: 'Cambios guardados' } })
    } catch (error) {
      setSaving(false)
      const apiError = error instanceof ApiError ? error : null
      // Nothing was saved: the edit is all-or-nothing.
      if (apiError?.code === ErrorCode.LISTING_NOT_EDITABLE) onNotEditable()
      else if (apiError?.code === ErrorCode.LISTING_NOT_FOUND) onNotFound()
      else if (apiError?.code === ErrorCode.NOT_LISTING_OWNER) onNotOwner()
      else if (apiError?.code === ErrorCode.CATEGORY_NOT_FOUND) {
        details.setError('categoryId', 'Esta categoría ya no existe. Elige otra.')
        setNotice('Revisa los datos marcados.')
      } else if (apiError?.code === ErrorCode.INVALID_PHOTO_KEY) {
        details.setError('photos', 'Quita las fotos nuevas y vuelve a subirlas.')
        setNotice('Revisa los datos marcados.')
      } else if (apiError?.code === ErrorCode.VALIDATION_ERROR) {
        for (const { field } of apiError.details ?? []) {
          const formField = detailsFieldOf(field)
          if (formField) details.setError(formField, 'Revisa este dato.')
        }
        setNotice('Revisa los datos marcados.')
      } else if (apiError?.code !== ErrorCode.UNAUTHORIZED) {
        // A 401 needs nothing here: the expired session already sends the user to login.
        setNotice('No pudimos guardar los cambios. Inténtalo de nuevo.')
      }
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={`/listings/${listing.id}`} />
      <PageContainer width="narrow" bottomSpace="actions" className="space-y-6">
        <PageHeader
          title="Editar artículo"
          description="Los cambios se ven de inmediato. Tu artículo conserva su lugar en el inicio."
        />
        <ListingDetailsForm form={details} categories={categories} />
      </PageContainer>

      <StickyActionBar
        note={details.uploading > 0 ? 'Espera a que terminen de subir las fotos.' : undefined}
      >
        <Button
          fullWidth
          disabled={details.uploading > 0 || saving}
          aria-busy={saving}
          onClick={save}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </StickyActionBar>

      {notice && (
        <ToastViewport>
          <Toast tone="error" onDismiss={() => setNotice(null)}>
            {notice}
          </Toast>
        </ToastViewport>
      )}
    </div>
  )
}
