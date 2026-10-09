import type { City } from '@/lib/auth'

export const CITY_OPTIONS: { value: City; label: string }[] = [
  { value: 'COCHABAMBA_BO', label: 'Cochabamba, BO' },
  { value: 'AREQUIPA_PE', label: 'Arequipa, PE' },
  { value: 'SAN_SALVADOR_SV', label: 'San Salvador, SV' },
  { value: 'UTAH_US', label: 'Utah, US' },
]

export function cityLabel(city: City): string {
  return CITY_OPTIONS.find(({ value }) => value === city)?.label ?? city
}

export function isCity(value: unknown): value is City {
  return CITY_OPTIONS.some((option) => option.value === value)
}
