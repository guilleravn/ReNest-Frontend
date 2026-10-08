/** wa.me link to `phoneE164` with a prefilled message (contract §2: number without "+"). */
export function whatsappHref(phoneE164: string, message?: string): string {
  const url = `https://wa.me/${phoneE164.replace(/^\+/, '')}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}

/** Buyer's first message about a listing (BRW-7). `price` is already formatted. */
export function listingQuestionMessage(sellerName: string, title: string, price: string): string {
  return `Hola ${sellerName}, vi tu "${title}" (${price}) en ReNest y tengo una pregunta.`
}
