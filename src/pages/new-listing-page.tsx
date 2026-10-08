import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SessionHeader } from '@/components/layout/session-header'
import { ListingDetailsForm, type CategoriesState } from '@/components/listing/listing-details-form'
import { PickupOptionSheet } from '@/components/listing/pickup-option-sheet'
import { PickupSlotItem, PickupSlotList } from '@/components/listing/pickup-slot-item'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StepProgress } from '@/components/ui/step-progress'
import { StickyActionBar } from '@/components/ui/sticky-action-bar'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { formatPickupTime } from '@/lib/format'
import { MAX_PICKUP_OPTIONS, type PickupOptionDraft } from '@/lib/listing-form'
import { getCategories, type Category } from '@/lib/listings'
import { useListingDetailsForm } from '@/lib/use-listing-details-form'

type Step = 1 | 2
type Notice = { tone: 'success' | 'error'; text: string }

/** New listing: details, then pickup availability. Nothing is saved until publishing (LST-9, LST-10). */
export function NewListingPage() {
  const [step, setStep] = useState<Step>(1)
  const details = useListingDetailsForm()
  const categories = useCategories()
  const [pickupOptions, setPickupOptions] = useState<PickupOptionDraft[]>([])
  const [addingPickup, setAddingPickup] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  // Toasts sit over the action bar, so they leave on their own.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

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
              description={`Agrega de 1 a ${MAX_PICKUP_OPTIONS} opciones de lugar y horario. El comprador elegirá una.`}
            />
            {pickupOptions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-text-muted">
                Aún no agregaste opciones de entrega.
              </p>
            ) : (
              <section aria-label="Opciones de entrega">
                <PickupSlotList>
                  {pickupOptions.map((option, index) => (
                    <PickupSlotItem
                      key={`${option.locationLabel}-${index}`}
                      place={option.locationLabel}
                      time={formatPickupTime(option.weekdays, option.startTime, option.endTime)}
                      onRemove={() => setPickupOptions((prev) => prev.filter((_, i) => i !== index))}
                    />
                  ))}
                </PickupSlotList>
              </section>
            )}
            {pickupOptions.length < MAX_PICKUP_OPTIONS ? (
              <Button variant="outline" fullWidth onClick={() => setAddingPickup(true)}>
                <Plus className="size-4" aria-hidden />
                Agregar horario y lugar
              </Button>
            ) : (
              <p className="text-center text-xs text-text-subtle">
                Ya agregaste el máximo de {MAX_PICKUP_OPTIONS} opciones.
              </p>
            )}
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              Volver a los datos del artículo
            </Button>
          </>
        )}
      </PageContainer>

      <PickupOptionSheet
        open={addingPickup}
        onOpenChange={setAddingPickup}
        onAdd={(option) => {
          setPickupOptions((prev) => [...prev, option])
          setNotice({ tone: 'success', text: 'Opción de entrega agregada' })
        }}
      />

      {step === 1 && (
        <StickyActionBar
          note={details.uploading > 0 ? 'Espera a que terminen de subir las fotos.' : undefined}
        >
          <Button fullWidth disabled={details.uploading > 0} onClick={continueToPickup}>
            Continuar
          </Button>
        </StickyActionBar>
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
