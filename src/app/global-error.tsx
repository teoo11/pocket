"use client"

/** Last resort when even the root layout fails: no translations or styles are available, so both languages. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f7f0e8", color: "#2e231d", padding: "4rem 1rem", textAlign: "center" }}>
        <h1>Something went wrong · Ceva n-a mers</h1>
        <p>Please try again in a moment. · Te rugăm să încerci din nou peste puțin timp.</p>
        <button
          onClick={reset}
          style={{ fontSize: "1.0625rem", padding: "0.9rem 1.5rem", borderRadius: "0.75rem", border: 0, background: "#a3624d", color: "#fff" }}
        >
          Try again · Încearcă din nou
        </button>
      </body>
    </html>
  )
}
