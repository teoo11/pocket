/**
 * Pay comes in two halves (SPEC §7): the first, ceil(pay / 2), when the helper starts; the rest after
 * the poster confirms. If the first half was skipped, the second payment is the full pay.
 * Amounts in the database are in bani (1 leu = 100 bani).
 */
export function halves(payLei: number): [first: number, second: number] {
  const first = Math.ceil(payLei / 2)
  return [first, payLei - first]
}

/** What part 2 costs: the pay minus what has already been paid. */
export function remainderLei(payLei: number, paidBani: number): number {
  return Math.max(0, payLei - paidBani / 100)
}

/**
 * Pocket's fee on a card payment, deducted from what the helper receives (STRIPE_FEE_PERCENT).
 * Rounded up to the next ban; never more than the amount.
 */
export function feeBani(amountBani: number, percent: number): number {
  if (!(percent > 0)) return 0
  return Math.min(amountBani, Math.ceil((amountBani * percent) / 100))
}

export function baniToLei(bani: number): number {
  return Math.round(bani) / 100
}
