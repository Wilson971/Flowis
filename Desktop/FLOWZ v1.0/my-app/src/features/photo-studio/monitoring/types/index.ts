export interface StudioQuota {
  generations_used: number
  generations_limit: number
  cost_usd: number
  month: string
}

export interface StudioStats {
  total_generations: number
  successful: number
  failed: number
  success_rate: number
  total_cost_usd: number
  avg_latency_ms: number
  by_action: Array<{
    action: string
    count: number
    avg_latency_ms: number
    cost_usd: number
    success_rate: number
  }>
  errors_by_type: Array<{
    error_type: string
    count: number
  }>
}
