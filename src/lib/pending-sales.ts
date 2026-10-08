import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getMyListings } from '@/lib/listings'

/** Accessible label of the Pending marker ("1 venta pendiente"). */
export function pendingSalesLabel(count: number): string {
  return count === 1 ? '1 venta pendiente' : `${count} ventas pendientes`
}

/**
 * Number of the seller's Pending listings (SAL-2), fetched on mount so it is
 * fresh after a handover. `undefined` while loading, when anonymous, or when
 * the request fails: the marker is a hint and never blocks the page.
 */
export function usePendingSalesCount(): number | undefined {
  const { status } = useAuth()
  const [count, setCount] = useState<number>()

  useEffect(() => {
    if (status !== 'authenticated') return
    let current = true
    getMyListings('PENDING').then(
      (items) => current && setCount(items.length),
      () => {},
    )
    return () => {
      current = false
    }
  }, [status])

  return status === 'authenticated' ? count : undefined
}
