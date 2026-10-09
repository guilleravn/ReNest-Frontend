import { useEffect, useState } from 'react'
import type { CategoriesState } from '@/components/listing/listing-details-form'
import { getCategories, type Category } from '@/lib/listings'

/** The categories for the listing details form, with a retry after an error. */
export function useCategories(): CategoriesState {
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
