import { useSyncExternalStore } from "react"

const noop = () => () => {}

/** False on the server and during hydration, true afterwards: for browser-only parts that must not change the first render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
