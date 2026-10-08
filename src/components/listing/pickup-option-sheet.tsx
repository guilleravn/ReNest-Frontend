import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { FormField } from "@/components/ui/form-field"
import { Input } from "@/components/ui/input"
import { Sheet } from "@/components/ui/sheet"
import { TrustNote } from "@/components/ui/trust-note"
import { weekdayShortLabel } from "@/lib/format"
import {
  emptyPickupOption,
  normalizePickupOption,
  validatePickupOption,
  WEEKDAYS,
  type PickupOptionDraft,
  type PickupOptionErrors,
} from "@/lib/listing-form"

type PickupOptionSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with a valid, trimmed pair; the sheet closes itself. */
  onAdd: (option: PickupOptionDraft) => void
}

/** "Agregar horario y lugar": one public place, its days and a time range (LST-7, LST-8). */
function PickupOptionSheet({ open, onOpenChange, onAdd }: PickupOptionSheetProps) {
  const [draft, setDraft] = useState(emptyPickupOption)
  const [errors, setErrors] = useState<PickupOptionErrors>({})

  function update<K extends keyof PickupOptionDraft>(field: K, value: PickupOptionDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function close(next: boolean) {
    if (!next) {
      setDraft(emptyPickupOption)
      setErrors({})
    }
    onOpenChange(next)
  }

  function submit() {
    const found = validatePickupOption(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onAdd(normalizePickupOption(draft))
    close(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title="Agregar horario y lugar"
      description="El comprador elegirá entre las opciones que agregues."
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button fullWidth onClick={submit}>
            Agregar opción
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Punto de encuentro"
          htmlFor="pickup-place"
          error={errors.locationLabel}
        >
          <Input
            id="pickup-place"
            value={draft.locationLabel}
            onChange={(event) => update("locationLabel", event.target.value)}
            invalid={Boolean(errors.locationLabel)}
            placeholder="ej. Café Toscano, Av. Álvaro Obregón"
          />
        </FormField>
        <TrustNote>
          Usa solo lugares públicos, como un café, una plaza o un centro comercial. Nunca tu domicilio.
        </TrustNote>
        <FormField label="Días" error={errors.weekdays}>
          <ChipGroup gap="sm" role="group" aria-label="Días">
            {WEEKDAYS.map((day) => {
              const selected = draft.weekdays.includes(day)
              return (
                <Chip
                  key={day}
                  shape="square"
                  variant="soft"
                  selected={selected}
                  onClick={() =>
                    update(
                      "weekdays",
                      selected ? draft.weekdays.filter((d) => d !== day) : [...draft.weekdays, day]
                    )
                  }
                >
                  {weekdayShortLabel(day)}
                </Chip>
              )
            })}
          </ChipGroup>
        </FormField>
        <div className="flex gap-4">
          <FormField label="Desde" htmlFor="pickup-start" error={errors.startTime} className="flex-1">
            <Input
              id="pickup-start"
              type="time"
              value={draft.startTime}
              onChange={(event) => update("startTime", event.target.value)}
              invalid={Boolean(errors.startTime)}
            />
          </FormField>
          <FormField label="Hasta" htmlFor="pickup-end" error={errors.endTime} className="flex-1">
            <Input
              id="pickup-end"
              type="time"
              value={draft.endTime}
              onChange={(event) => update("endTime", event.target.value)}
              invalid={Boolean(errors.endTime)}
            />
          </FormField>
        </div>
      </div>
    </Sheet>
  )
}

export { PickupOptionSheet }
export type { PickupOptionSheetProps }
