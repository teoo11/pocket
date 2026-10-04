/** While a signed-in page loads: a calm placeholder in the page column (no spinner). */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-[47.5rem] flex-col gap-4 px-4 pt-5" aria-busy="true">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-wm-track motion-reduce:animate-none" />
      <div className="h-28 animate-pulse rounded-3xl bg-wm-track motion-reduce:animate-none" />
      <div className="h-28 animate-pulse rounded-3xl bg-wm-track motion-reduce:animate-none" />
      <div className="h-28 animate-pulse rounded-3xl bg-wm-track motion-reduce:animate-none" />
    </main>
  )
}
