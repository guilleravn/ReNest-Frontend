import { Button } from "@/components/ui/button"
import { Chip, ChipGroup } from "@/components/ui/chip"
import { FormField } from "@/components/ui/form-field"
import { Input, Textarea } from "@/components/ui/input"
import { PhotoUploader } from "@/components/listing/photo-uploader"
import { conditionLabel } from "@/lib/format"
import {
  DESCRIPTION_MAX,
  MAX_PHOTOS,
  PHOTO_TYPES,
  TITLE_MAX,
} from "@/lib/listing-form"
import type { Category, ListingCondition } from "@/lib/listings"
import type { ListingDetailsForm as FormState } from "@/lib/use-listing-details-form"

const CONDITIONS: ListingCondition[] = ["LIKE_NEW", "GENTLY_USED", "HEAVILY_USED"]

type CategoriesState =
  | { status: "loading" }
  | { status: "error"; onRetry: () => void }
  | { status: "ready"; items: Category[] }

type ListingDetailsFormProps = {
  /** From `useListingDetailsForm`; start it with `initialValues` to edit. */
  form: FormState
  categories: CategoriesState
}

/** Photos, title, category, condition, price and description of a listing. */
function ListingDetailsForm({ form, categories }: ListingDetailsFormProps) {
  const { values, errors, uploading, setField } = form

  return (
    <div className="space-y-5">
      <FormField
        label="Fotos"
        aside={`${values.photos.length} de ${MAX_PHOTOS} · mínimo 1`}
        hint="La primera foto es la portada. JPG, PNG o WebP de hasta 5 MB."
        error={errors.photos}
      >
        <PhotoUploader
          photos={values.photos.map((photo) => photo.url)}
          onAdd={form.addPhotos}
          onRemove={form.removePhoto}
          max={MAX_PHOTOS}
          uploading={uploading}
          coverLabel="Portada"
          addLabel="Agregar foto"
          accept={PHOTO_TYPES.join(",")}
        />
      </FormField>

      <FormField
        label="Título"
        htmlFor="listing-title"
        aside={`${values.title.trim().length}/${TITLE_MAX}`}
        hint="Un título claro ayuda a que te encuentren."
        error={errors.title}
      >
        <Input
          id="listing-title"
          value={values.title}
          onChange={(event) => setField("title", event.target.value)}
          invalid={Boolean(errors.title)}
          placeholder="ej. Silla de comedor en roble"
        />
      </FormField>

      <FormField label="Categoría" error={errors.categoryId}>
        {categories.status === "loading" && (
          <p role="status" className="text-sm text-text-muted">
            Cargando categorías…
          </p>
        )}
        {categories.status === "error" && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-muted">No pudimos cargar las categorías.</p>
            <Button size="md" variant="secondary" onClick={categories.onRetry}>
              Reintentar
            </Button>
          </div>
        )}
        {categories.status === "ready" && (
          <ChipGroup role="group" aria-label="Categoría">
            {categories.items.map((category) => (
              <Chip
                key={category.id}
                variant="soft"
                size="md"
                selected={values.categoryId === category.id}
                onClick={() => setField("categoryId", category.id)}
              >
                {category.name}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </FormField>

      <FormField label="Condición" error={errors.condition}>
        <ChipGroup role="group" aria-label="Condición">
          {CONDITIONS.map((condition) => (
            <Chip
              key={condition}
              variant="soft"
              size="md"
              selected={values.condition === condition}
              onClick={() => setField("condition", condition)}
            >
              {conditionLabel(condition)}
            </Chip>
          ))}
        </ChipGroup>
      </FormField>

      <FormField
        label="Precio"
        htmlFor="listing-price"
        hint="Número entero, en dólares. Al menos $1."
        error={errors.price}
      >
        <Input
          id="listing-price"
          inputMode="numeric"
          value={values.price}
          onChange={(event) => setField("price", event.target.value)}
          invalid={Boolean(errors.price)}
          placeholder="0"
        />
      </FormField>

      <FormField
        label="Descripción"
        htmlFor="listing-description"
        aside={`${values.description.trim().length}/${DESCRIPTION_MAX}`}
        hint="Cuenta el estado, las medidas y si le falta algo."
        error={errors.description}
      >
        <Textarea
          id="listing-description"
          value={values.description}
          onChange={(event) => setField("description", event.target.value)}
          invalid={Boolean(errors.description)}
          rows={5}
        />
      </FormField>
    </div>
  )
}

export { ListingDetailsForm }
export type { ListingDetailsFormProps, CategoriesState }
