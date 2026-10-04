import { PublicHeader } from "@/components/shell/app-shell"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-[77.5rem] flex-col items-center px-4 pt-6 pb-16">{children}</main>
    </>
  )
}
