import React, { useMemo } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

import {
  MorphSurfaceContext,
  useMorphSurfaceLogic,
  FEEDBACK_WIDTH,
  FEEDBACK_HEIGHT,
  SPEED,
  type MorphSurfaceProps,
} from "./MorphSurfaceContext"
import { MorphSurfaceDock, MorphSurfaceFeedback } from "./MorphSurfaceDock"

// Root component
export function MorphSurface({
  collapsedWidth = FEEDBACK_WIDTH,
  collapsedHeight = 44,
  expandedWidth = FEEDBACK_WIDTH,
  expandedHeight = FEEDBACK_HEIGHT,
  animationSpeed = SPEED,
  springConfig,
  triggerLabel = "Feedback",
  triggerIcon,
  placeholder = "What's on your mind?",
  submitLabel,
  dockLabel = "Morph Surface",
  onSubmit,
  onOpen,
  onClose,
  onSuccess,
  isOpen: controlledIsOpen,
  onOpenChange,
  fullWidth = false,
  className,
  triggerClassName,
  contentClassName,
  renderTrigger,
  renderContent,
  renderIndicator,
}: MorphSurfaceProps = {}) {
  const hookLogic = useMorphSurfaceLogic({
    isOpen: controlledIsOpen,
    onOpenChange,
    expandedWidth,
    expandedHeight,
    collapsedHeight,
    animationSpeed,
  })

  const {
    containerRef,
    inputRef,
    showFeedback,
    success,
    openFeedback,
    closeFeedback,
    setSuccess,
    expandedWidth: hookExpandedWidth,
    expandedHeight: hookExpandedHeight,
    collapsedHeight: hookCollapsedHeight,
  } = hookLogic

  function onFeedbackSuccess() {
    closeFeedback()
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
    }, 1500)
    onSuccess?.()
  }

  const context = useMemo(
    () => ({
      showFeedback,
      success,
      openFeedback: () => {
        openFeedback()
        onOpen?.()
      },
      closeFeedback: () => {
        closeFeedback()
        onClose?.()
      },
      triggerLabel,
      triggerIcon,
      placeholder,
      submitLabel: submitLabel || "⌘ Enter",
      dockLabel,
      onSubmit,
      onOpen,
      onClose,
      onSuccess,
      triggerClassName,
      contentClassName,
      renderTrigger,
      renderContent,
      renderIndicator,
      animationSpeed,
      springConfig,
      expandedWidth: hookExpandedWidth,
      expandedHeight: hookExpandedHeight,
      fullWidth,
    }),
    [
      showFeedback,
      success,
      openFeedback,
      closeFeedback,
      triggerLabel,
      triggerIcon,
      placeholder,
      submitLabel,
      dockLabel,
      onSubmit,
      onOpen,
      onClose,
      onSuccess,
      triggerClassName,
      contentClassName,
      renderTrigger,
      renderContent,
      renderIndicator,
      animationSpeed,
      springConfig,
      hookExpandedWidth,
      hookExpandedHeight,
      fullWidth,
    ]
  )

  return (
    <div
      className={cn("flex justify-center items-end", fullWidth && "w-full", className)}
      style={fullWidth
        ? { height: hookExpandedHeight }
        : { width: hookExpandedWidth, height: hookExpandedHeight }
      }
    >
      <motion.div
        ref={containerRef}
        onClick={() => {
          if (!showFeedback) {
            openFeedback()
          }
        }}
        className={cn(
          "relative flex flex-col items-center bottom-8 z-10 overflow-hidden",
          "bg-card dark:bg-muted",
          "shadow-[0px_1px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(255,_252,_240,_0.5)_inset,_0px_0px_0px_1px_hsla(0,_0%,_100%,_0.1)_inset,_0px_0px_1px_0px_rgba(28,_27,_26,_0.5)]",
          "dark:shadow-[0px_1px_0px_0px_hsla(0,_0%,_0%,_0.02)_inset,_0px_0px_0px_1px_hsla(0,_0%,_0%,_0.02)_inset,_0px_0px_0px_1px_rgba(255,_255,_255,_0.25)]",
          !showFeedback &&
            "cursor-pointer hover:brightness-105 transition-[filter] duration-200"
        )}
        initial={false}
        animate={{
          width: fullWidth ? "100%" : (showFeedback ? hookExpandedWidth : collapsedWidth),
          height: showFeedback ? hookExpandedHeight : hookCollapsedHeight,
          borderRadius: showFeedback ? 14 : 20,
        }}
        transition={
          springConfig || {
            type: "spring",
            stiffness: 550 / animationSpeed,
            damping: 45,
            mass: 0.7,
            delay: showFeedback ? 0 : 0.08,
          }
        }
      >
        <MorphSurfaceContext.Provider value={context}>
          <MorphSurfaceDock />
          <MorphSurfaceFeedback ref={inputRef} onSuccess={onFeedbackSuccess} />
        </MorphSurfaceContext.Provider>
      </motion.div>
    </div>
  )
}
