export type Tone = "brand" | "coral" | "sky" | "plum" | "sun" | "sage" | "grey"

/** Tailwind classes for each tint (the prototype's .t-brand, .t-coral, …). */
export const TONE_CLASSES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-text",
  coral: "bg-coral-soft text-coral-text",
  sky: "bg-sky-soft text-sky-text",
  plum: "bg-plum-soft text-plum-text",
  sun: "bg-sun-soft text-sun-text",
  sage: "bg-sage-soft text-sage-text",
  grey: "bg-secondary text-muted-foreground",
}
