import React from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

import { useMorphSurface } from "./MorphSurfaceContext"
import { IconCheck, Kbd } from "./icons"

// Dock component
export function MorphSurfaceDock() {
  const {
    success,
    showFeedback,
    openFeedback,
    triggerLabel,
    triggerIcon,
    triggerClassName,
    renderTrigger,
    renderIndicator,
    animationSpeed,
    springConfig,
    fullWidth,
    dockLabel,
  } = useMorphSurface()

  const logoSpring = springConfig || {
    type: "spring" as const,
    stiffness: 350 / animationSpeed,
    damping: 35,
  }

  const checkSpring = {
    type: "spring" as const,
    stiffness: 500 / animationSpeed,
    damping: 22,
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    openFeedback()
  }

  const defaultIndicator = (
    <>
      {showFeedback ? (
        <div className="w-5 h-5" style={{ opacity: 0 }} />
      ) : (
        <motion.div
          className="w-5 h-5 bg-primary rounded-full"
          layoutId={`morph-surface-dot-${triggerLabel}`}
          transition={logoSpring}
        >
          <AnimatePresence>
            {success && (
              <motion.div
                key="check"
                exit={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.5 }}
                transition={{
                  ...checkSpring,
                  delay: success ? 0.3 : 0,
                }}
                className="m-[2px]"
              >
                <IconCheck />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  )

  const defaultTrigger = (
    <button
      type="button"
      className={cn(
        "m-[-8px] flex justify-end rounded-full p-2 flex-1 gap-1",
        "text-muted-foreground hover:text-foreground",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        triggerClassName
      )}
      onClick={handleTriggerClick}
    >
      {triggerIcon && <span className="flex items-center">{triggerIcon}</span>}
      <span className="ml-1 max-w-[20ch] truncate">{triggerLabel}</span>
    </button>
  )

  const indicatorElement = renderIndicator
    ? renderIndicator({
        success,
        isOpen: showFeedback,
      })
    : defaultIndicator

  const triggerElement = renderTrigger
    ? renderTrigger({
        isOpen: showFeedback,
        onClick: () => openFeedback(),
        className: triggerClassName,
      })
    : defaultTrigger

  return (
    <footer className={cn(
      "flex items-center select-none whitespace-nowrap mt-auto h-[44px]",
      fullWidth ? "w-full justify-start" : "justify-center"
    )}>
      <div className={cn(
        "flex items-center gap-6 px-3",
        fullWidth ? "w-full gap-0 px-0" : "justify-center"
      )}>
        {!fullWidth && (
          <div className="flex items-center gap-2 w-fit">
            {indicatorElement}
            {dockLabel && <div className="text-sm text-foreground">{dockLabel}</div>}
          </div>
        )}
        {triggerElement}
      </div>
    </footer>
  )
}

// Feedback component
export const MorphSurfaceFeedback = React.forwardRef<
  HTMLTextAreaElement,
  { onSuccess: () => void }
>(({ onSuccess }, ref) => {
  const {
    closeFeedback,
    showFeedback,
    placeholder,
    onSubmit,
    contentClassName,
    renderContent,
    expandedWidth,
    expandedHeight,
    animationSpeed,
    triggerLabel,
    fullWidth,
  } = useMorphSurface()
  const submitRef = React.useRef<HTMLButtonElement>(null)

  const contentSpring = {
    type: "spring" as const,
    stiffness: 550 / animationSpeed,
    damping: 45,
    mass: 0.7,
  }

  const logoSpring = {
    type: "spring" as const,
    stiffness: 350 / animationSpeed,
    damping: 35,
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (onSubmit) {
      try {
        await onSubmit(formData)
        onSuccess()
      } catch (error) {
        console.error("Form submission error:", error)
      }
    } else {
      onSuccess()
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      closeFeedback()
    }
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      submitRef.current?.click()
    }
  }

  const defaultContent = (
    <>
      <div className="flex justify-between py-1">
        <p className="flex gap-[6px] text-sm items-center text-muted-foreground select-none z-[2] ml-[25px]">
          Feedback
        </p>
        <button
          type="submit"
          ref={submitRef}
          className={cn(
            "mt-1 flex items-center justify-center gap-1 text-sm -translate-y-[3px]",
            "text-muted-foreground right-4 text-center bg-transparent select-none",
            "rounded-xl cursor-pointer pr-1",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Kbd>⌘</Kbd>
          <Kbd className="w-fit">Enter</Kbd>
        </button>
      </div>
      <textarea
        ref={ref}
        placeholder={placeholder}
        name="message"
        className={cn(
          "resize-none w-full h-full scroll-py-2 text-base outline-none p-4",
          "bg-muted dark:bg-accent rounded-xl",
          "caret-primary",
          "placeholder:text-muted-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
        )}
        required
        onKeyDown={onKeyDown}
        spellCheck={false}
      />
    </>
  )

  const handleContentSubmit = async (data: FormData) => {
    if (onSubmit) {
      try {
        await onSubmit(data)
        onSuccess()
      } catch (error) {
        console.error("Form submission error:", error)
      }
    } else {
      onSuccess()
    }
  }

  const contentElement = renderContent
    ? renderContent({
        isOpen: showFeedback,
        onClose: closeFeedback,
        onSubmit: handleContentSubmit,
        className: contentClassName,
      })
    : defaultContent

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("absolute bottom-0", fullWidth ? "w-full" : "", contentClassName)}
      style={{
        width: fullWidth ? "100%" : expandedWidth,
        height: expandedHeight,
        pointerEvents: showFeedback ? "all" : "none",
      }}
    >
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={contentSpring}
            className="p-1 flex flex-col h-full"
          >
            {contentElement}
          </motion.div>
        )}
      </AnimatePresence>
      {showFeedback && (
        <motion.div
          layoutId={`morph-surface-dot-${triggerLabel}`}
          className="w-2 h-2 bg-primary rounded-full absolute top-[18.5px] left-4"
          transition={logoSpring}
        />
      )}
    </form>
  )
})

MorphSurfaceFeedback.displayName = "MorphSurfaceFeedback"
