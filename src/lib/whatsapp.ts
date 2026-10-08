/** wa.me link to `phoneE164` with a prefilled message (contract §2: number without "+"). */
export function whatsappHref(phoneE164: string, message?: string): string {
  const url = `https://wa.me/${phoneE164.replace(/^\+/, '')}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}

/** Buyer's first message about a listing (BRW-7). */
export function listingQuestionMessage(title: string): string {
  return `Hola, vi tu artículo "${title}" en ReNest y tengo una consulta.`
}
