import { useState } from "react"
import { Plus } from "lucide-react"
import { PhotoUploader } from "@/components/listing/photo-uploader"
import { PickupSlotItem, PickupSlotList } from "@/components/listing/pickup-slot-item"
import { Button } from "@/components/ui/button"
import { Checkbox, CheckboxLink } from "@/components/ui/checkbox"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { FormField } from "@/components/ui/form-field"
import { Input, Select, Textarea } from "@/components/ui/input"
import { OptionCard, OptionCardGroup } from "@/components/ui/option-card"
import { SearchInput } from "@/components/ui/search-input"
import { Sheet } from "@/components/ui/sheet"
import { StarRating } from "@/components/ui/star-rating"
import { StepProgress } from "@/components/ui/step-progress"
import { StickyActionBar } from "@/components/ui/sticky-action-bar"
import { Toast } from "@/components/ui/toast"
import { Demo, Demos, KitLayout, Section, img } from "./kit-layout"

type BarMode = "off" | "narrow" | "wide" | "note"

export function UiKitFormsPage() {
  const [search, setSearch] = useState("silla")
  const [pickup, setPickup] = useState(0)
  const [checks, setChecks] = useState<number[]>([0])
  const [ratings, setRatings] = useState([0, 3, 5])
  const [photos, setPhotos] = useState<string[]>([img("wooden-dresser.jpg"), img("wooden-dresser-2.jpg")])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirm, setConfirm] = useState<null | "default" | "custom" | "children">(null)
  const [bar, setBar] = useState<BarMode>("off")
  const [fab, setFab] = useState(false)

  return (
    <KitLayout
      activeTo="/ui-kit/forms"
      title="Forms & overlays"
      description="Fields, choices, and elements that open on top or stay fixed on screen."
    >
      <Section
        name="SearchInput"
        varies="value, onClear (when set and there is text, the × shows), placeholder."
        fixed="Magnifier on the left, 48px tall, green border on focus."
      >
        <Demos cols={3}>
          <Demo props="no value" className="block">
            <SearchInput placeholder="Buscar por título" />
          </Demo>
          <Demo props="value + onClear (interactive)" className="block">
            <SearchInput
              placeholder="Buscar por título"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
            />
          </Demo>
          <Demo props="value without onClear" className="block">
            <SearchInput placeholder="Buscar por título" defaultValue="silla" />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Input / Textarea"
        varies="invalid (red border), disabled, type, placeholder, rows (Textarea)."
        fixed="1.5px border, md radius, 16px text, green border on focus."
      >
        <Demos cols={4}>
          <Demo props="default" className="block">
            <Input placeholder="ej. Mesa de roble" />
          </Demo>
          <Demo props="value" className="block">
            <Input defaultValue="Mesa de roble para 6" />
          </Demo>
          <Demo props="invalid" className="block">
            <Input invalid placeholder="0" />
          </Demo>
          <Demo props="disabled" className="block">
            <Input disabled defaultValue="No editable" />
          </Demo>
          <Demo props='type="time"' className="block">
            <Input type="time" defaultValue="18:00" />
          </Demo>
          <Demo props="<Textarea />" className="block">
            <Textarea placeholder="Detalles de la condición..." rows={3} />
          </Demo>
          <Demo props="<Textarea invalid />" className="block">
            <Textarea invalid rows={3} />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Select"
        varies="placeholder (disabled first option until the user picks), invalid, disabled, children (<option>)."
        fixed="Native select styled like Input: same height, border and focus ring."
      >
        <Demos cols={3}>
          <Demo props='placeholder="Elige tu zona"' className="block">
            <Select placeholder="Elige tu zona" aria-label="Zona">
              <option value="COCHABAMBA_BO">Cochabamba, BO</option>
              <option value="AREQUIPA_PE">Arequipa, PE</option>
            </Select>
          </Demo>
          <Demo props="invalid" className="block">
            <Select invalid placeholder="Elige tu zona" aria-label="Zona inválida">
              <option value="COCHABAMBA_BO">Cochabamba, BO</option>
            </Select>
          </Demo>
          <Demo props="disabled" className="block">
            <Select disabled defaultValue="AREQUIPA_PE" aria-label="Zona fija">
              <option value="AREQUIPA_PE">Arequipa, PE</option>
            </Select>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Checkbox / CheckboxLink"
        varies="checked, disabled, children (label; may contain CheckboxLink)."
        fixed="Square box left of the label; CheckboxLink is green."
      >
        <Demos cols={3}>
          <Demo props="children" className="block">
            <Checkbox>Recordarme</Checkbox>
          </Demo>
          <Demo props="defaultChecked + CheckboxLink" className="block">
            <Checkbox defaultChecked>
              Acepto los <CheckboxLink href="#">Términos</CheckboxLink>.
            </Checkbox>
          </Demo>
          <Demo props="disabled" className="block">
            <Checkbox disabled>No disponible</Checkbox>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="FormField"
        varies="aside (text right of the label), hint (gray helper), error (red message; when set, the hint is hidden)."
        fixed="Bold label on top, control in the middle, message below."
      >
        <Demos cols={2}>
          <Demo props='label="Título"' className="block">
            <FormField label="Título">
              <Input placeholder="ej. Mesa de roble" />
            </FormField>
          </Demo>
          <Demo props='+ hint="…"' className="block">
            <FormField label="Título" hint="Un título claro ayuda a que te encuentren.">
              <Input placeholder="ej. Mesa de roble" />
            </FormField>
          </Demo>
          <Demo props='+ aside="Opcional"' className="block">
            <FormField label="Descripción" aside="Opcional">
              <Textarea rows={2} />
            </FormField>
          </Demo>
          <Demo props='+ hint + error="…" (error wins)' className="block">
            <FormField label="Precio" hint="Número entero, en dólares." error="Ingresa un precio de al menos $1">
              <Input invalid placeholder="0" />
            </FormField>
          </Demo>
          <Demo props="Chips as the control" className="block">
            <FormField label="Condición" error="Elige una condición">
              <ChipGroup>
                <Chip variant="soft" size="md">Como nuevo</Chip>
                <Chip variant="soft" size="md">Poco uso</Chip>
              </ChipGroup>
            </FormField>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="StepProgress"
        varies="currentStep / totalSteps (bar width), label, stepLabel."
        fixed="Thin green bar on gray; small labels on top."
      >
        <Demos cols={3}>
          <Demo props="currentStep={1} totalSteps={2}" className="block">
            <StepProgress label="Nuevo artículo" currentStep={1} totalSteps={2} />
          </Demo>
          <Demo props="currentStep={2} totalSteps={2}" className="block">
            <StepProgress label="Nuevo artículo" currentStep={2} totalSteps={2} />
          </Demo>
          <Demo props='currentStep={1} totalSteps={4} stepLabel="25%"' className="block">
            <StepProgress label="Perfil" currentStep={1} totalSteps={4} stepLabel="25%" />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="OptionCard"
        varies="indicator (radio = circle, single choice · checkbox = square, multiple), selected (green border and background + check), disabled."
        fixed="Full-width row, xl radius, text right of the indicator."
      >
        <Demos cols={2}>
          <Demo props='indicator="radio" (interactive)' className="block">
            <OptionCardGroup role="radiogroup" aria-label="Opciones de recogida">
              {["Cuadra del vendedor · martes y jueves, 18:00–20:00", "Café Toscano · sábados, 10:00–13:00"].map(
                (label, i) => (
                  <OptionCard key={label} selected={pickup === i} onClick={() => setPickup(i)}>
                    {label}
                  </OptionCard>
                )
              )}
            </OptionCardGroup>
          </Demo>
          <Demo props='indicator="checkbox" (interactive)' className="block">
            <OptionCardGroup>
              {["Coincide con las fotos", "Funciona / sin daños"].map((label, i) => (
                <OptionCard
                  key={label}
                  indicator="checkbox"
                  selected={checks.includes(i)}
                  onClick={() =>
                    setChecks((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
                  }
                >
                  {label}
                </OptionCard>
              ))}
            </OptionCardGroup>
          </Demo>
          <Demo props="disabled · selected false / true" className="block">
            <OptionCardGroup>
              <OptionCard disabled>Opción no disponible</OptionCard>
              <OptionCard disabled selected>
                Opción bloqueada
              </OptionCard>
            </OptionCardGroup>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="StarRating"
        varies="value (how many stars are filled), max, onChange."
        fixed="Amber when filled, light gray when empty; grow on hover."
      >
        <Demos cols={3}>
          {ratings.map((value, i) => (
            <Demo key={i} props={`value={${value}} (interactive)`} className="justify-center">
              <StarRating
                value={value}
                onChange={(v) => setRatings((prev) => prev.map((r, idx) => (idx === i ? v : r)))}
              />
            </Demo>
          ))}
          <Demo props="value={2} max={3}" className="justify-center">
            <StarRating value={2} max={3} />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="PhotoUploader"
        varies="photos (number of thumbnails), max (the 'Agregar' tile hides when reached), addLabel."
        fixed="3-column grid (4 on desktop), square thumbnails with × button and a dashed add tile."
      >
        <Demos cols={3}>
          <Demo props="photos={[]}" className="block">
            <PhotoUploader photos={[]} onAdd={() => {}} onRemove={() => {}} />
          </Demo>
          <Demo props="photos={[…2]} (interactive)" className="block">
            <PhotoUploader
              photos={photos}
              onAdd={(files) => setPhotos((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])}
              onRemove={(i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </Demo>
          <Demo props="photos={[…3]} max={3}" className="block">
            <PhotoUploader
              photos={[img("vintage-turntable.jpg"), img("vintage-turntable-2.jpeg"), img("vintage-turntable-3.jpg")]}
              max={3}
              onAdd={() => {}}
              onRemove={() => {}}
            />
          </Demo>
        </Demos>
      </Section>

      <Section
        name="PickupSlotItem"
        varies="place, time, onRemove (shows the trash button)."
        fixed="Gray box, location pin and clock."
      >
        <Demos cols={2}>
          <Demo props="with onRemove" className="block">
            <PickupSlotList>
              <PickupSlotItem place="Parque México" time="los lunes · 18:00–20:00" onRemove={() => {}} />
              <PickupSlotItem place="Café Toscano, Av. Álvaro Obregón" time="los sábados · 10:00–13:00" onRemove={() => {}} />
            </PickupSlotList>
          </Demo>
          <Demo props="without onRemove" className="block">
            <PickupSlotList>
              <PickupSlotItem place="Parque México" time="los lunes · 18:00–20:00" />
            </PickupSlotList>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="Sheet"
        varies="title, description, children (scrollable body), footer."
        fixed="Slides up on mobile (with grab handle), right side panel on desktop, dimmed backdrop."
      >
        <Demos cols={3}>
          <Demo props="title + description + footer">
            <Button variant="outline" size="md" onClick={() => setSheetOpen(true)}>
              Open Sheet
            </Button>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="ConfirmDialog"
        varies="title, description, confirmLabel, cancelLabel, children (extra content)."
        fixed="Slides up on mobile, centered on desktop; primary button + ghost cancel button."
      >
        <Demos cols={3}>
          <Demo props='default cancelLabel ("Ahora no")'>
            <Button variant="outline" size="md" onClick={() => setConfirm("default")}>
              Open
            </Button>
          </Demo>
          <Demo props='cancelLabel="Volver" without description'>
            <Button variant="outline" size="md" onClick={() => setConfirm("custom")}>
              Open
            </Button>
          </Demo>
          <Demo props="with children">
            <Button variant="outline" size="md" onClick={() => setConfirm("children")}>
              Open
            </Button>
          </Demo>
        </Demos>
      </Section>

      <Section
        name="StickyActionBar"
        varies="width (narrow = form width · wide = detail width, with the button centered at max-w-md), note."
        fixed="Fixed to the bottom, translucent white background and top border."
      >
        <Demos cols={4}>
          {(["narrow", "wide", "note"] as const).map((mode) => (
            <Demo key={mode} props={mode === "note" ? 'note="…"' : `width="${mode}"`}>
              <Button
                variant={bar === mode ? "primary" : "outline"}
                size="md"
                onClick={() => setBar(bar === mode ? "off" : mode)}
              >
                {bar === mode ? "Hide" : "Show"}
              </Button>
            </Demo>
          ))}
          <Demo props="<FloatingActionButton />">
            <Button variant={fab ? "primary" : "outline"} size="md" onClick={() => setFab(!fab)}>
              {fab ? "Hide" : "Show"}
            </Button>
          </Demo>
        </Demos>
      </Section>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Agregar horario y lugar"
        description="El comprador elegirá entre las opciones que agregues."
        footer={
          <>
            <Button variant="ghost" fullWidth onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={() => setSheetOpen(false)}>
              Agregar opción
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Punto de encuentro">
            <Input placeholder="ej. Kiosco del Parque México" />
          </FormField>
          <FormField label="Días">
            <ChipGroup gap="sm">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <Chip key={d} shape="square" variant="soft">
                  {d}
                </Chip>
              ))}
            </ChipGroup>
          </FormField>
          <div className="flex gap-4">
            <FormField label="Desde" className="flex-1">
              <Input type="time" defaultValue="18:00" />
            </FormField>
            <FormField label="Hasta" className="flex-1">
              <Input type="time" defaultValue="20:00" />
            </FormField>
          </div>
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirm === "default"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Confirmar la entrega?"
        description="Hazlo solo cuando el comprador ya tenga el artículo. Esto cierra el artículo."
        confirmLabel="Sí, ya lo entregué"
        onConfirm={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "custom"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Eliminar este artículo?"
        confirmLabel="Eliminar"
        cancelLabel="Volver"
        onConfirm={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "children"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="¿Cancelar la recogida?"
        description="Cuéntale al vendedor por qué."
        confirmLabel="Cancelar recogida"
        onConfirm={() => setConfirm(null)}
      >
        <Textarea rows={3} placeholder="ej. Ya no lo necesito" />
      </ConfirmDialog>

      {bar !== "off" && (
        <StickyActionBar
          width={bar === "wide" ? "wide" : "narrow"}
          note={bar === "note" ? "Agrega al menos una opción de recogida para publicar." : undefined}
        >
          <Button fullWidth disabled={bar === "note"}>
            {bar === "note" ? "Publicar artículo" : "Confirmar recogida"}
          </Button>
        </StickyActionBar>
      )}
      {fab && (
        <FloatingActionButton to="/listings/new" icon={<Plus className="size-4" aria-hidden />}>
          Nuevo artículo
        </FloatingActionButton>
      )}

      <Section
        name="Toast / ToastViewport"
        varies="tone (success · error), onDismiss (shows the ×)."
        fixed="Icon, short bold text. In pages, place it inside ToastViewport (fixed at the bottom)."
      >
        <Demos cols={2}>
          <Demo props='tone="success"' className="block">
            <Toast>Sesión cerrada</Toast>
          </Demo>
          <Demo props='tone="error" + onDismiss' className="block">
            <Toast tone="error" onDismiss={() => {}}>
              Correo o contraseña incorrectos
            </Toast>
          </Demo>
        </Demos>
      </Section>
    </KitLayout>
  )
}
