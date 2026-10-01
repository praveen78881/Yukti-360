import * as React from "react"

import { cn } from "@/lib/utils"

/* Fields rest in a pale cream-2 well with a 1.5px sand border; on focus they
   turn white with a slate-blue border and a 3px soft ring. Errors take the bad
   border plus ring. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-[10px] border-[1.5px] border-[var(--sand)] bg-[var(--cream-2)] px-3 py-1 text-sm text-[var(--ink)] outline-none transition-[color,background-color,border-color,box-shadow] duration-[160ms] ease-out",
        "selection:bg-[var(--navy-soft)] selection:text-[var(--navy-2)] placeholder:text-[var(--ink-3)]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-display file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.1em] file:text-[var(--navy)]",
        "focus-visible:border-[var(--slate-blue)] focus-visible:bg-white focus-visible:shadow-[0_0_0_3px_rgba(23,69,127,0.12)] focus-visible:outline-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--sand)] disabled:bg-[var(--cream)] disabled:text-[var(--ink-3)]",
        "aria-invalid:border-[var(--bad)] aria-invalid:shadow-[0_0_0_3px_rgba(178,59,51,0.14)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
