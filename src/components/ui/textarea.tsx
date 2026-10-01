import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[10px] border-[1.5px] border-[var(--sand)] bg-[var(--cream-2)] px-3 py-2 text-sm leading-relaxed text-[var(--ink)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[160ms] ease-out",
        "placeholder:text-[var(--ink-3)] selection:bg-[var(--navy-soft)] selection:text-[var(--navy-2)]",
        "focus-visible:border-[var(--slate-blue)] focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(23,69,127,0.12)] focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:border-[var(--sand)] disabled:bg-[var(--cream)] disabled:text-[var(--ink-3)]",
        "aria-invalid:border-[var(--bad)] aria-invalid:shadow-[0_0_0_3px_rgba(178,59,51,0.14)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
