import { useEffect, useId, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CircleAlert, MessageCircle, PackageX } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { SellerCard } from '@/components/listing/seller-card'
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FormField } from '@/components/ui/form-field'
import { Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { ApiError } from '@/lib/api'
import { cityLabel } from '@/lib/cities'
import { formatPrice, formatSellerRating } from '@/lib/format'
import { getListing, type ListingDetail } from '@/lib/listings'
import { expireSession } from '@/lib/session'
import { listingQuestionMessage, whatsappHref } from '@/lib/whatsapp'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; listing: ListingDetail }

export function ItemContactPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const messageId = useId()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let current = true
    getListing(id).then(
      (listing) => {
        if (!current) return
        // The API hides the phone from anyone it doesn't recognize (GEN-7):
        // the stored session is no longer valid, so log in again.
        if (listing.seller.phoneE164 === null) {
          expireSession()
          navigate('/login', { replace: true, state: { from: location.pathname } })
          return
        }
        // Only an Active listing of someone else can be asked about (BRW-8, BRW-9);
        // its detail page explains why not.
        if (listing.status !== 'ACTIVE' || listing.viewer.isSeller) {
          navigate(`/items/${listing.id}`, { replace: true })
          return
        }
        setState({ status: 'ready', listing })
        setMessage(
          listingQuestionMessage(
            listing.seller.fullName,
            listing.title,
            formatPrice(listing.priceCents),
          ),
        )
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
  }, [id, attempt, location.pathname, navigate])

  function retry() {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  const listing = state.status === 'ready' ? state.listing : null

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={`/items/${id}`} />
      <PageContainer width="narrow" className="space-y-6">
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

        {listing?.seller.phoneE164 && (
          <>
            <PageHeader overline="Escribe al vendedor" title="¿Preguntas sobre este producto?" />
            <section aria-label="Vendedor">
              <SellerCard
                name={listing.seller.fullName}
                avatarSrc={listing.seller.avatarUrl ?? undefined}
                verified={listing.seller.isVerified}
                {...formatSellerRating(listing.seller.rating)}
                location={cityLabel(listing.seller.city)}
              />
            </section>
            <FormField label="Tu mensaje" htmlFor={messageId}>
              <Textarea
                id={messageId}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </FormField>
            <ButtonAnchor
              href={whatsappHref(listing.seller.phoneE164, message.trim() || undefined)}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              <MessageCircle aria-hidden />
              Abrir en WhatsApp
            </ButtonAnchor>
          </>
        )}
      </PageContainer>
    </div>
  )
}
