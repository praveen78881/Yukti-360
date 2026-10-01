"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[5px] border-[1.5px] border-[var(--sand-2)] bg-white transition-[background-color,border-color,box-shadow] duration-[160ms] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)] disabled:cursor-not-allowed disabled:border-[var(--sand)] disabled:bg-[var(--cream)] aria-invalid:border-[var(--bad)] data-[state=checked]:border-[var(--navy)] data-[state=checked]:bg-[var(--navy)] data-[state=checked]:text-white data-[state=indeterminate]:border-[var(--navy)] data-[state=indeterminate]:bg-[var(--navy)] data-[state=indeterminate]:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
