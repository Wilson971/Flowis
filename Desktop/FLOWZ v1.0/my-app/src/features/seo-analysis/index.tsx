export function useSEOAnalysis() {
    return { analysis: null };
}

export function SEOBadge({ score, showLabel, size, onClick }: any) {
    return <div onClick={onClick}>SEO: {score}</div>
}

export function getScoreColorConfig(score: number) {
    return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
}
