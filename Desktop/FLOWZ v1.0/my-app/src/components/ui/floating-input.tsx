"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Input, type InputProps } from "./input"

interface FloatingInputProps extends InputProps {
  label: string
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, id, variant, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="relative">
        <Input
          id={inputId}
          ref={ref}
          variant={variant}
          placeholder=" "
          className={cn("peer pt-4 pb-1 h-11 min-h-[44px]", className)}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
            "origin-top-left transition-all duration-200",
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100",
            "peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:scale-[0.85] peer-focus:text-primary",
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:scale-[0.85]"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)
FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
