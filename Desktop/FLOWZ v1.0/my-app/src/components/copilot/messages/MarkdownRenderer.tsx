"use client"

import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResponseCard } from "../cards/ResponseCard"
import type { ResponseCardType } from "@/types/copilot"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const segments = useMemo(() => parseContent(content), [content])

  return (
    <div className="space-y-2 text-sm">
      {segments.map((segment, i) => (
        <SegmentRenderer key={i} segment={segment} />
      ))}
    </div>
  )
}

type Segment =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string }
  | { type: "card"; cardType: ResponseCardType; data: Record<string, unknown> }

function parseContent(content: string): Segment[] {
  const segments: Segment[] = []
  const codeBlockRegex = /```(\w[\w:]*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) })
    }

    const lang = match[1]
    const body = match[2].trim()

    if (lang.startsWith("json:card:")) {
      const cardType = lang.replace("json:card:", "") as ResponseCardType
      try {
        const data = JSON.parse(body)
        segments.push({ type: "card", cardType, data })
      } catch {
        segments.push({ type: "code", language: "json", content: body })
      }
    } else {
      segments.push({ type: "code", language: lang, content: body })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) })
  }

  return segments
}

function SegmentRenderer({ segment }: { segment: Segment }) {
  if (segment.type === "card") {
    return <ResponseCard type={segment.cardType} data={segment.data} />
  }
  if (segment.type === "code") {
    return <CodeBlock language={segment.language} content={segment.content} />
  }
  return <TextBlock content={segment.content} />
}

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-lg border border-border/40 bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <span className="text-xs text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs">
        <code>{content}</code>
      </pre>
    </div>
  )
}

function TextBlock({ content }: { content: string }) {
  const lines = content.split("\n")

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <br key={i} />

        if (trimmed.startsWith("### "))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{renderInline(trimmed.slice(4))}</h4>
        if (trimmed.startsWith("## "))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{renderInline(trimmed.slice(3))}</h3>
        if (trimmed.startsWith("# "))
          return <h2 key={i} className="font-bold text-lg mt-3 mb-1">{renderInline(trimmed.slice(2))}</h2>

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return <li key={i} className="ml-4 list-disc">{renderInline(trimmed.slice(2))}</li>
        }

        const orderedMatch = trimmed.match(/^(\d+)\.\s(.*)/)
        if (orderedMatch) {
          return <li key={i} className="ml-4 list-decimal">{renderInline(orderedMatch[2])}</li>
        }

        return <p key={i}>{renderInline(trimmed)}</p>
      })}
    </>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[2])
      parts.push(<strong key={match.index} className="font-semibold">{match[2]}</strong>)
    else if (match[3])
      parts.push(<em key={match.index}>{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code key={match.index} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
          {match[4]}
        </code>
      )
    else if (match[5] && match[6])
      parts.push(
        <a
          key={match.index}
          href={match[6]}
          className="text-primary underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[5]}
        </a>
      )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length === 1 ? parts[0] : parts
}
