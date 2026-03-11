"use client"

import { ProductCard } from "./ProductCard"
import { SeoCard } from "./SeoCard"
import { ArticleCard } from "./ArticleCard"
import { KpiCard } from "./KpiCard"
import { BatchProgressCard } from "./BatchProgressCard"
import { ComparisonCard } from "./ComparisonCard"

export type ResponseCardType = "product" | "seo" | "article" | "kpi" | "batch_progress" | "comparison"

interface ResponseCardProps {
  type: ResponseCardType
  data: Record<string, unknown>
}

export function ResponseCard({ type, data }: ResponseCardProps) {
  switch (type) {
    case "product":
      return <ProductCard data={data} />
    case "seo":
      return <SeoCard data={data} />
    case "article":
      return <ArticleCard data={data} />
    case "kpi":
      return <KpiCard data={data} />
    case "batch_progress":
      return <BatchProgressCard data={data} />
    case "comparison":
      return <ComparisonCard data={data} />
    default:
      return null
  }
}
