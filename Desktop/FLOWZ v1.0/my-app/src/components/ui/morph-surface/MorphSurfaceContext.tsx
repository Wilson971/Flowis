import React, {
  createContext,
  useContext,
  useRef,
  useState,
} from "react"

import { useClickOutside } from "./useClickOutside"

// Types
export type SpringConfig = {
  type: "spring"
  stiffness: number
  damping: number
  mass?: number
  delay?: number
}

export interface TriggerProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export interface ContentProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void | Promise<void>
  className?: string
}

export interface IndicatorProps {
  success: boolean
  isOpen: boolean
  className?: string
}

export interface MorphSurfaceProps {
  // Dimensions
  collapsedWidth?: number | "auto"
  collapsedHeight?: number
  expandedWidth?: number
  expandedHeight?: number

  // Animation
  animationSpeed?: number
  springConfig?: SpringConfig

  // Content
  triggerLabel?: string
  triggerIcon?: React.ReactNode
  placeholder?: string
  submitLabel?: string
  /** Label shown next to the indicator dot in collapsed state. Pass "" to hide. */
  dockLabel?: string

  // Callbacks
  onSubmit?: (data: FormData) => void | Promise<void>
  onOpen?: () => void
  onClose?: () => void
  onSuccess?: () => void

  // Controlled state
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void

  // Layout
  /** Fill the parent's width instead of using fixed pixel dimensions */
  fullWidth?: boolean

  // Styles
  className?: string
  triggerClassName?: string
  contentClassName?: string

  // Render props
  renderTrigger?: (props: TriggerProps) => React.ReactNode
  renderContent?: (props: ContentProps) => React.ReactNode
  renderIndicator?: (props: IndicatorProps) => React.ReactNode
}

export interface MorphSurfaceContextValue {
  showFeedback: boolean
  success: boolean
  openFeedback: () => void
  closeFeedback: () => void
  // Configurable props
  triggerLabel: string
  triggerIcon?: React.ReactNode
  placeholder: string
  submitLabel: string
  dockLabel: string
  onSubmit?: (data: FormData) => void | Promise<void>
  onOpen?: () => void
  onClose?: () => void
  onSuccess?: () => void
  triggerClassName?: string
  contentClassName?: string
  renderTrigger?: (props: TriggerProps) => React.ReactNode
  renderContent?: (props: ContentProps) => React.ReactNode
  renderIndicator?: (props: IndicatorProps) => React.ReactNode
  animationSpeed: number
  springConfig?: SpringConfig
  expandedWidth: number
  expandedHeight: number
  fullWidth: boolean
}

// Constants
export const SPEED = 1
export const FEEDBACK_WIDTH = 360
export const FEEDBACK_HEIGHT = 200

// Context
export const MorphSurfaceContext = createContext<MorphSurfaceContextValue>(
  {} as MorphSurfaceContextValue
)

export const useMorphSurface = () => useContext(MorphSurfaceContext)

// Internal hook logic
export function useMorphSurfaceLogic({
  isOpen: controlledIsOpen,
  onOpenChange,
  expandedWidth = FEEDBACK_WIDTH,
  expandedHeight = FEEDBACK_HEIGHT,
  collapsedHeight = 44,
  animationSpeed = SPEED,
}: {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  expandedWidth?: number
  expandedHeight?: number
  collapsedHeight?: number
  animationSpeed?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const showFeedback = isOpen

  function closeFeedback() {
    if (controlledIsOpen !== undefined) {
      onOpenChange?.(false)
    } else {
      setInternalIsOpen(false)
    }
    inputRef.current?.blur()
  }

  function openFeedback() {
    if (controlledIsOpen !== undefined) {
      onOpenChange?.(true)
    } else {
      setInternalIsOpen((prev) => !prev)
    }
    if (!showFeedback) {
      setTimeout(() => {
        inputRef.current?.focus()
      })
    }
  }

  function setSuccessState(value: boolean) {
    setSuccess(value)
  }

  useClickOutside(containerRef, closeFeedback)

  return {
    containerRef,
    inputRef,
    showFeedback,
    success,
    openFeedback,
    closeFeedback,
    setSuccess: setSuccessState,
    expandedWidth,
    expandedHeight,
    collapsedHeight,
    animationSpeed,
  }
}
