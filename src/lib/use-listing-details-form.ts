import { useState } from 'react'
import { ApiError } from '@/lib/api'
import { ErrorCode } from '@/lib/error-codes'
import {
  emptyListingDetails,
  MAX_PHOTOS,
  photoFileError,
  validateListingDetails,
  type ListingDetailsErrors,
  type ListingDetailsField,
  type ListingDetailsValues,
} from '@/lib/listing-form'
import { uploadPhoto } from '@/lib/listings'

/**
 * State of the listing details form (new listing step 1; reusable prefilled
 * for editing). Photos upload as soon as they are picked, one at a time so
 * they keep the order they were picked in.
 */
export function useListingDetailsForm(initialValues: ListingDetailsValues = emptyListingDetails) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ListingDetailsErrors>({})
  const [uploading, setUploading] = useState(0)

  function setField<K extends ListingDetailsField>(field: K, value: ListingDetailsValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function setError(field: ListingDetailsField, message: string) {
    setErrors((prev) => ({ ...prev, [field]: message }))
  }

  async function addPhotos(files: File[]) {
    const free = MAX_PHOTOS - values.photos.length - uploading
    const picked = files.slice(0, Math.max(0, free))
    const invalid = picked.map(photoFileError).find(Boolean)
    const valid = picked.filter((file) => !photoFileError(file))
    setErrors((prev) => ({
      ...prev,
      photos:
        invalid ??
        (files.length > picked.length ? `Puedes agregar hasta ${MAX_PHOTOS} fotos` : undefined),
    }))

    setUploading((n) => n + valid.length)
    for (const file of valid) {
      try {
        const photo = await uploadPhoto(file)
        setValues((prev) => ({ ...prev, photos: [...prev.photos, photo] }))
      } catch (error) {
        const code = error instanceof ApiError ? error.code : null
        // A 401 needs nothing here: the expired session already sends the user to login.
        if (code !== ErrorCode.UNAUTHORIZED) {
          setError(
            'photos',
            code === ErrorCode.INVALID_FILE
              ? 'Usa fotos JPG, PNG o WebP de hasta 5 MB'
              : 'No pudimos subir una foto. Inténtalo de nuevo.',
          )
        }
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  function removePhoto(index: number) {
    setField(
      'photos',
      values.photos.filter((_, i) => i !== index),
    )
  }

  /** Shows every field error; true when the form can be submitted. */
  function validate(): boolean {
    const found = validateListingDetails(values)
    setErrors(found)
    return Object.keys(found).length === 0 && uploading === 0
  }

  return { values, errors, uploading, setField, setError, addPhotos, removePhoto, validate }
}

export type ListingDetailsForm = ReturnType<typeof useListingDetailsForm>
