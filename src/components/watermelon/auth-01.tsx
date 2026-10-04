/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: split into composable parts (double card, icon input, password field, divider,
 * provider buttons) so the same frame serves sign-up, log-in and password reset; lucide icons;
 * Pocket's large sizes.
 */
"use client"

import { Eye, EyeOff, type LucideIcon } from "lucide-react"
import { useId, useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** The double card: a muted outer shell with the white inner card, and an optional footer prompt. */
export function AuthCard({
  heading,
  subheading,
  children,
  footer,
  className,
}: {
  heading: React.ReactNode
  subheading?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("w-full max-w-md rounded-[2rem] border-[1.6px] border-border bg-muted p-2", className)}>
      <div className="rounded-3xl bg-card px-5 py-7 shadow-[0_2px_4px_0_rgb(0_0_0/0.12)] sm:px-7">
        <header className="mb-5 flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">{heading}</h1>
          {subheading ? <p className="text-muted-foreground">{subheading}</p> : null}
        </header>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
      {footer ? <footer className="px-4 pt-4 pb-3 text-center text-muted-foreground">{footer}</footer> : null}
    </div>
  )
}

type IconInputProps = React.ComponentProps<"input"> & {
  icon: LucideIcon
  label: string
  error?: string
  /** A button inside the right edge of the input (e.g. show password). */
  trailing?: React.ReactNode
}

/** A labelled input with a leading icon. The label is visible above (older eyes, screen readers). */
export function IconInput({ icon: Icon, label, error, trailing, className, id, ...props }: IconInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-semibold">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn("pl-12", className)}
          {...props}
        />
        {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
      </div>
      {error ? (
        <p id={errorId} className="text-[0.9375rem] font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Password field with a show/hide toggle. */
export function PasswordInput({
  icon,
  label,
  error,
  showLabel,
  hideLabel,
  ...props
}: IconInputProps & { showLabel: string; hideLabel: string }) {
  const [visible, setVisible] = useState(false)
  const Toggle = visible ? EyeOff : Eye
  return (
    <IconInput
      icon={icon}
      label={label}
      error={error}
      type={visible ? "text" : "password"}
      className="pr-14"
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="grid size-12 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Toggle className="size-5" aria-hidden />
        </button>
      }
      {...props}
    />
  )
}

export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[0.9375rem] text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
