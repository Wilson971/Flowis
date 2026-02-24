import { cn } from "@/lib/utils"

export function IconCheck() {
  return (
    <svg
      width="16px"
      height="16px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      color="white"
    >
      <title>Icon Check</title>
      <path
        d="M5 13L9 17L19 7"
        stroke="currentColor"
        strokeWidth="2px"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Kbd({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <kbd
      className={cn(
        "w-6 h-6 bg-muted text-muted-foreground rounded flex items-center justify-center font-sans px-[6px] text-xs",
        className
      )}
    >
      {children}
    </kbd>
  )
}
