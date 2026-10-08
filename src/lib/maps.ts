/** Google Maps search for a pickup place (contract §2). */
export function mapsHref(locationLabel: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`
}
