"use client"

import { Component, type ReactNode } from "react"

/**
 * Google's map code can throw inside React (a rejected key, a map removed while it loads). The map is a
 * nice-to-have, so a failure shows `fallback` (nothing by default) instead of the page's error screen.
 */
export class MapBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn("[maps] map failed and was hidden:", error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
