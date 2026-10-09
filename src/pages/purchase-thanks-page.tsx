import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ButtonLink } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { TextLink } from '@/components/ui/text-link'
import { Toast, ToastViewport } from '@/components/ui/toast'

/** What the rating step tells this screen; absent when opened directly. */
export interface PurchaseThanksState {
  sellerName: string
  rated: boolean
}

/**
 * Where the buyer lands after rating or skipping it. A skipped rating stays
 * available from the recap (PUR-9), so the screen says where to find it.
 */
export function PurchaseThanksPage() {
  const { id = '' } = useParams()
  const outcome = useLocation().state as PurchaseThanksState | null
  const [showToast, setShowToast] = useState(outcome?.rated === true)
  const recap = `/purchases/${id}`

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo={recap} />
      <PageContainer width="narrow">
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <CircleCheck aria-hidden className="size-12 text-green-strong" />
          <PageHeader
            align="center"
            title="Intercambio completado"
            description="La recogida está confirmada. Gracias por hacerlo en ReNest."
          />

          {outcome && !outcome.rated && (
            <p className="text-sm text-text-muted">
              Puedes calificar a {outcome.sellerName} cuando quieras desde el{' '}
              <TextLink to={recap}>resumen de tu compra</TextLink>.
            </p>
          )}

          <div className="flex w-full flex-col gap-2.5">
            <ButtonLink to="/purchases" fullWidth>
              Volver a Mis compras
            </ButtonLink>
            <ButtonLink to="/feed" variant="outline" fullWidth>
              Seguir explorando
            </ButtonLink>
          </div>
        </div>
      </PageContainer>

      {showToast && outcome && (
        <ToastViewport>
          <Toast onDismiss={() => setShowToast(false)}>
            Gracias por calificar a {outcome.sellerName}
          </Toast>
        </ToastViewport>
      )}
    </div>
  )
}
