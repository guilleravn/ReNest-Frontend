import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ListingDetailsForm, type CategoriesState } from '@/components/listing/listing-details-form'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StepProgress } from '@/components/ui/step-progress'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { getCategories, type Category } from '@/lib/listings'
import { useListingDetailsForm } from '@/lib/use-listing-details-form'

type Step = 1 | 2

/** New listing: details, then pickup availability. Nothing is saved until publishing (LST-9, LST-10). */
export function NewListingPage() {
  const [step, setStep] = useState<Step>(1)
  const details = useListingDetailsForm()
  const categories = useCategories()

  function continueToPickup() {
    if (!details.validate()) return
    setStep(2)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SessionHeader backTo="/listings" />
      <PageContainer width="narrow" bottomSpace="actions" className="space-y-6">
        <StepProgress label="Nuevo artículo" currentStep={step} totalSteps={2} />

        {step === 1 && (
          <>
            <PageHeader
              title="Describe tu artículo"
              description="Agrega 3 fotos para vender unas 2× más rápido."
            />
            <ListingDetailsForm form={details} categories={categories} />
          </>
        )}

        {step === 2 && (
          <>
            <PageHeader
              title="Disponibilidad de entrega"
              description="Indica dónde y cuándo puedes entregar el artículo."
            />
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              Volver a los datos del artículo
            </Button>
          </>
        )}
      </PageContainer>

      {step === 1 && (
        <StickyActionBar
          note={details.uploading > 0 ? 'Espera a que terminen de subir las fotos.' : undefined}
        >
          <Button fullWidth disabled={details.uploading > 0} onClick={continueToPickup}>
            Continuar
          </Button>
        </StickyActionBar>
      )}
    </div>
  )
}

function useCategories(): CategoriesState {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<
    { attempt: number; items: Category[] } | { attempt: number; error: true } | null
  >(null)

  useEffect(() => {
    let current = true
    getCategories().then(
      (items) => current && setResult({ attempt, items }),
      () => current && setResult({ attempt, error: true }),
    )
    return () => {
      current = false
    }
  }, [attempt])

  if (!result || result.attempt !== attempt) return { status: 'loading' }
  if ('error' in result) return { status: 'error', onRetry: () => setAttempt((n) => n + 1) }
  return { status: 'ready', items: result.items }
}
