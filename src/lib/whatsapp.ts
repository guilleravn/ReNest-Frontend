/** wa.me link to `phoneE164` with a prefilled message (contract §2: number without "+"). */
export function whatsappHref(phoneE164: string, message?: string): string {
  const url = `https://wa.me/${phoneE164.replace(/^\+/, '')}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}

/** Buyer's first message after reserving: the exact day is agreed on WhatsApp (RES-2). */
export function pickupMessage(sellerName: string, title: string, place: string): string {
  return `Hola ${sellerName}, reservé tu "${title}" en ReNest. ¿Qué día te queda bien para la recogida en ${place}?`
}

/** Buyer's first message about a listing (BRW-7). `price` is already formatted. */
export function listingQuestionMessage(sellerName: string, title: string, price: string): string {
  return `Hola ${sellerName}, vi tu "${title}" (${price}) en ReNest y tengo una pregunta.`
}

/** Seller's first message to the buyer who reserved `title`. */
export function saleMessage(buyerName: string, title: string): string {
  return `Hola ${buyerName}, te escribo por "${title}" que reservaste en ReNest.`
}
