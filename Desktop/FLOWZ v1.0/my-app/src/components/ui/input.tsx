import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const inputVariants = cva(
  "flex h-9 w-full rounded-lg border px-3 py-1 text-sm shadow-none transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[error=true]:border-destructive data-[error=true]:ring-4 data-[error=true]:ring-destructive/10 data-[error=true]:animate-error-shake data-[success=true]:border-success data-[success=true]:ring-4 data-[success=true]:ring-success/10",
  {
    variants: {
      variant: {
        default:
          "border-border bg-background focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
        soft: "border-border/60 bg-muted/30 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
        glass:
          "bg-card/40 backdrop-blur-sm border-border/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
