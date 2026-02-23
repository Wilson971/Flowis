"use client";

/**
 * AI Artifact Chart — Demo Page
 *
 * Inspiré de @cult-ui-pro/ai-artifact-chart
 * Chat interface left | Interactive Recharts artifact right
 * Adapté au contexte e-commerce FLOWZ (revenus, produits, blog, burn rate)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  Sparkles,
  TrendingUp,
  BarChart2,
  Activity,
  ChevronRight,
  Zap,
  Package,
  FileText,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motionTokens } from "@/lib/design-system";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type ChartScenario = "idle" | "revenue" | "products" | "content" | "burnrate";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  scenario?: ChartScenario;
}

interface MetricItem {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

// ─────────────────────────────────────────────
// CHART DATA & SCENARIOS
// ─────────────────────────────────────────────

const SCENARIOS = {
  revenue: {
    title: "Analyse Revenus — Q1 2026",
    subtitle: "Oct 2025 → Mar 2026 · Store FLOWZ",
    metrics: [
      { label: "CA Total", value: "50 700 €", delta: "+16.7%", positive: true },
      { label: "Dépenses", value: "56 600 €", delta: "-2.1%", positive: true },
      { label: "Marge Brute", value: "41.3%", delta: "+3.2 pts", positive: true },
      { label: "Bénéfice Net", value: "40 500 €", delta: "+28%", positive: true },
    ] as MetricItem[],
    chartType: "area" as const,
    data: [
      { month: "Oct", revenue: 12400, expenses: 8200, profit: 4200 },
      { month: "Nov", revenue: 14200, expenses: 8900, profit: 5300 },
      { month: "Déc", revenue: 19800, expenses: 11200, profit: 8600 },
      { month: "Jan", revenue: 15600, expenses: 9400, profit: 6200 },
      { month: "Fév", revenue: 16900, expenses: 9100, profit: 7800 },
      { month: "Mar", revenue: 18200, expenses: 9800, profit: 8400 },
    ],
  },
  products: {
    title: "Top Produits — Mars 2026",
    subtitle: "Classement par chiffre d'affaires",
    metrics: [
      { label: "Produits analysés", value: "5 / 48", delta: "top tier", positive: true },
      { label: "CA combiné", value: "15 400 €", delta: "+22%", positive: true },
      { label: "Unités vendues", value: "920", delta: "+18%", positive: true },
      { label: "Panier moyen", value: "16.74 €", delta: "+3.4%", positive: true },
    ] as MetricItem[],
    chartType: "bar" as const,
    data: [
      { name: "Théière Premium", revenue: 4850, units: 97 },
      { name: "Set Café Bio", revenue: 3920, units: 196 },
      { name: "Infuseur Bambou", revenue: 2640, units: 264 },
      { name: "Tasse Céramique", revenue: 2100, units: 300 },
      { name: "Pack Découverte", revenue: 1890, units: 63 },
    ],
  },
  content: {
    title: "ROI Contenu Blog — 6 mois",
    subtitle: "Articles → Trafic organique → Conversions",
    metrics: [
      { label: "Articles publiés", value: "43", delta: "+175%", positive: true },
      { label: "Trafic organique", value: "14 850", delta: "+242%", positive: true },
      { label: "Conversions totales", value: "257", delta: "+322%", positive: true },
      { label: "Conv. / article", value: "5.98", delta: "+54%", positive: true },
    ] as MetricItem[],
    chartType: "line" as const,
    data: [
      { month: "Oct", articles: 4, traffic: 1200, conversions: 18 },
      { month: "Nov", articles: 6, traffic: 1850, conversions: 28 },
      { month: "Déc", articles: 8, traffic: 2400, conversions: 42 },
      { month: "Jan", articles: 5, traffic: 2100, conversions: 35 },
      { month: "Fév", articles: 9, traffic: 3200, conversions: 58 },
      { month: "Mar", articles: 11, traffic: 4100, conversions: 76 },
    ],
  },
  burnrate: {
    title: "Burn Rate & Cash Flow",
    subtitle: "Trésorerie et runway — 6 derniers mois",
    metrics: [
      { label: "Cash disponible", value: "72 300 €", delta: "+60.7%", positive: true },
      { label: "Burn mensuel", value: "9 800 €", delta: "-5.2%", positive: true },
      { label: "Runway estimé", value: "7.4 mois", delta: "+1.9 mois", positive: true },
      { label: "Rentabilité", value: "Atteinte ✓", delta: "Nov 2025", positive: true },
    ] as MetricItem[],
    chartType: "composed" as const,
    data: [
      { month: "Oct", cash: 45000, burn: 8200, revenue: 12400 },
      { month: "Nov", cash: 41400, burn: 8900, revenue: 14200 },
      { month: "Déc", cash: 49200, burn: 11200, revenue: 19800 },
      { month: "Jan", cash: 56600, burn: 9400, revenue: 15600 },
      { month: "Fév", cash: 64100, burn: 9100, revenue: 16900 },
      { month: "Mar", cash: 72300, burn: 9800, revenue: 18200 },
    ],
  },
} as const;

// ─────────────────────────────────────────────
// AI RESPONSES (simulated streaming)
// ─────────────────────────────────────────────

const AI_RESPONSES: Record<string, { text: string; scenario: ChartScenario }> =
  {
    revenue: {
      scenario: "revenue",
      text: `Sur Q1 2026, votre chiffre d'affaires a atteint **50 700 €**, soit une croissance de **+16.7%** vs Q4 2025.

📈 Points clés :
- Pic record en décembre (+39% vs mois moyen) grâce aux fêtes
- Marge brute moyenne de **41.3%**, en hausse de +3.2 pts
- Trend haussier confirmé sur février–mars

⚠️ Les dépenses représentent ~55% du CA. Une optimisation du poste marketing pourrait améliorer la marge de 4 à 6 pts. Artifact généré ci-contre →`,
    },
    products: {
      scenario: "products",
      text: `Voici votre **top 5 produits** par revenu pour mars 2026 :

🥇 Théière Premium : 4 850 € (97 unités)
🥈 Set Café Bio : 3 920 € (196 unités)
🥉 Infuseur Bambou : 2 640 € (264 unités)

💡 Recommandation : L'Infuseur Bambou génère le meilleur ratio volume/marge. Augmentez son exposition en page d'accueil et dans vos prochains articles FloWriter. Artifact généré →`,
    },
    content: {
      scenario: "content",
      text: `Votre stratégie contenu affiche une **croissance exponentielle** sur 6 mois :

- +242% de trafic organique
- Taux de conversion stable : ~1.85%
- Chaque article génère en moyenne **6 conversions**

🚀 Mars record : 11 articles publiés → 76 conversions → ROI estimé +340% vs coût de production. Continuez à publier 9–11 articles/mois. Artifact généré →`,
    },
    burnrate: {
      scenario: "burnrate",
      text: `Votre situation financière est **saine et en nette amélioration** :

💰 Cash disponible : 72 300 € (+60% depuis octobre)
🔥 Burn mensuel moyen : 9 450 €
⏱️ Runway : 7.4 mois (objectif : >12 mois)

✅ Vos revenus couvrent désormais 1.86x vos dépenses. Le seuil de rentabilité a été franchi en novembre 2025. Artifact généré →`,
    },
  };

const QUICK_PROMPTS = [
  {
    id: "revenue",
    label: "Revenus Q1 2026",
    icon: TrendingUp,
    color: "text-primary",
    query: "Analyse mes revenus pour Q1 2026",
  },
  {
    id: "products",
    label: "Top produits",
    icon: Package,
    color: "text-violet-500",
    query: "Montre-moi les performances de mes top produits",
  },
  {
    id: "content",
    label: "ROI contenu blog",
    icon: FileText,
    color: "text-emerald-500",
    query: "Quel est le ROI de ma stratégie contenu blog ?",
  },
  {
    id: "burnrate",
    label: "Burn rate & Cash",
    icon: Flame,
    color: "text-orange-500",
    query: "Analyse mon burn rate et mon cash flow",
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const formatEuro = (v: number) => `${(v / 1000).toFixed(0)}k€`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name} :</span>
          <span className="font-medium text-foreground">
            {typeof entry.value === "number" && entry.value > 200
              ? `${entry.value.toLocaleString("fr-FR")} €`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// CHART RENDERER
// ─────────────────────────────────────────────

function ArtifactChart({ scenario }: { scenario: ChartScenario }) {
  if (scenario === "idle") return null;
  const s = SCENARIOS[scenario];

  if (scenario === "revenue") {
    return (
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart
          data={[...s.data]}
          margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatEuro}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenus"
            stroke="hsl(var(--primary))"
            fill="url(#gRevenue)"
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Dépenses"
            stroke="#f97316"
            fill="url(#gExpenses)"
            strokeWidth={2}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Bénéfice"
            stroke="#22c55e"
            fill="url(#gProfit)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (scenario === "products") {
    return (
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={[...s.data]}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={formatEuro}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            name="Revenus"
            fill="hsl(var(--primary))"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (scenario === "content") {
    return (
      <ResponsiveContainer width="100%" height={230}>
        <LineChart
          data={[...s.data]}
          margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="traffic"
            name="Trafic"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="conversions"
            name="Conversions"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#22c55e" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="articles"
            name="Articles"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: "#a855f7" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (scenario === "burnrate") {
    return (
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart
          data={[...s.data]}
          margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatEuro}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="cash"
            name="Cash"
            stroke="#22c55e"
            fill="url(#gCash)"
            strokeWidth={2}
            dot={false}
          />
          <Bar
            dataKey="burn"
            name="Burn"
            fill="#f97316"
            opacity={0.75}
            radius={[3, 3, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenus"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// STREAMING TEXT RENDERER (simple markdown)
// ─────────────────────────────────────────────

function StreamingText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className={line === "" ? "h-1.5" : undefined}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────

function MetricCard({ metric, index }: { metric: MetricItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...motionTokens.transitions.fast,
        delay: index * 0.07,
      }}
    >
      <Card className="p-3">
        <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
        <p className="text-[15px] font-semibold mt-0.5 text-foreground">
          {metric.value}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium mt-1",
            metric.positive ? "text-emerald-500" : "text-destructive"
          )}
        >
          {metric.positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {metric.delta}
        </span>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function AiArtifactChartPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant analytique FLOWZ.\n\nPosez-moi une question sur vos performances e-commerce, ou utilisez les suggestions ci-dessous pour générer un artifact interactif.",
      scenario: "idle",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ChartScenario>("idle");
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const detectScenario = (text: string): keyof typeof AI_RESPONSES | null => {
    const t = text.toLowerCase();
    if (t.includes("revenu") || t.includes("chiffre") || t.includes("q1"))
      return "revenue";
    if (
      t.includes("produit") ||
      t.includes("top") ||
      t.includes("vente") ||
      t.includes("performance")
    )
      return "products";
    if (
      t.includes("blog") ||
      t.includes("contenu") ||
      t.includes("roi") ||
      t.includes("trafic")
    )
      return "content";
    if (
      t.includes("burn") ||
      t.includes("cash") ||
      t.includes("trésor") ||
      t.includes("runway")
    )
      return "burnrate";
    return null;
  };

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isStreaming) return;

      setInput("");

      // Add user message
      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: messageText },
      ]);

      const promptKey = detectScenario(messageText);
      const aiMsgId = `ai-${Date.now()}`;

      // Add empty assistant message (streaming placeholder)
      setIsStreaming(true);
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: "assistant",
          content: "",
          isStreaming: true,
          scenario: promptKey ? AI_RESPONSES[promptKey].scenario : "idle",
        },
      ]);

      // Simulated character streaming
      const responseText = promptKey
        ? AI_RESPONSES[promptKey].text
        : "Je n'ai pas de données pour cette requête. Essayez : revenus Q1, top produits, ROI blog, ou burn rate.";

      const chars = responseText.split("");
      let accumulated = "";

      for (const char of chars) {
        accumulated += char;
        const snapshot = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: snapshot } : m
          )
        );
        // Variable delay for natural feel
        await new Promise((r) =>
          setTimeout(r, char === "\n" ? 60 : 8 + Math.random() * 10)
        );
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);

      // Trigger artifact generation with delay
      if (promptKey) {
        setIsGeneratingArtifact(true);
        await new Promise((r) => setTimeout(r, 700));
        setActiveScenario(AI_RESPONSES[promptKey].scenario);
        setIsGeneratingArtifact(false);
      }
    },
    [input, isStreaming]
  );

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Conversation réinitialisée. Posez-moi une question sur vos données e-commerce !",
        scenario: "idle",
      },
    ]);
    setActiveScenario("idle");
    setInput("");
  };

  const currentScenario =
    activeScenario !== "idle" ? SCENARIOS[activeScenario] : null;

  return (
    <div className="flex flex-col flex-1 p-4 gap-4 max-w-[1400px] mx-auto w-full">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTokens.transitions.default}
        className="flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-none">
              AI Artifact Chart
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspiré de{" "}
              <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">
                @cult-ui-pro/ai-artifact-chart
              </code>{" "}
              · Adapté FLOWZ
            </p>
          </div>
          <Badge variant="outline" className="ml-2 text-xs">
            Demo
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      </motion.div>

      {/* ── Split Layout ── */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* ── LEFT — Chat Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={motionTokens.transitions.default}
          className="w-[42%] min-w-[320px] flex flex-col min-h-0"
        >
          <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border">
            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0 bg-card">
              <div className="relative">
                <Bot className="h-5 w-5 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none">
                  Analytics Assistant
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isStreaming ? (
                    <span className="text-primary animate-pulse">
                      Génération en cours…
                    </span>
                  ) : (
                    "Prêt"
                  )}
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-[10px] gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                Gemini 2.0
              </Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={motionTokens.transitions.fast}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                        msg.role === "assistant"
                          ? "bg-primary/10"
                          : "bg-muted"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          V
                        </span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm",
                        msg.role === "assistant"
                          ? "bg-muted/60 text-foreground rounded-tl-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <>
                          <StreamingText text={msg.content} />
                          {msg.isStreaming && (
                            <span className="inline-flex gap-0.5 ml-1 mt-1">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className="w-1 h-1 bg-primary/60 rounded-full inline-block"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{
                                    duration: 0.9,
                                    repeat: Infinity,
                                    delay: i * 0.18,
                                  }}
                                />
                              ))}
                            </span>
                          )}
                        </>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2.5 border-t border-border shrink-0">
              <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                Suggestions rapides
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map(({ id, label, icon: Icon, color, query }) => (
                  <button
                    key={id}
                    onClick={() => handleSend(query)}
                    disabled={isStreaming}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium",
                      "border border-border bg-background hover:bg-muted",
                      "transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn("h-3 w-3", color)} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Posez une question sur vos données… (↵ pour envoyer)"
                  disabled={isStreaming}
                  rows={1}
                  className="flex-1 resize-none min-h-[38px] max-h-[96px] text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="h-[38px] w-[38px] p-0 rounded-xl shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Shift+↵ pour nouvelle ligne
              </p>
            </div>
          </Card>
        </motion.div>

        {/* ── RIGHT — Artifact Panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={motionTokens.transitions.default}
          className="flex-1 flex flex-col min-h-0"
        >
          <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border">
            {/* Artifact header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0 bg-card">
              <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {currentScenario ? currentScenario.title : "Artifact"}
                </p>
                {currentScenario && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {currentScenario.subtitle}
                  </p>
                )}
              </div>
              {currentScenario && !isGeneratingArtifact && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px] gap-1 hover:bg-emerald-500/10 shrink-0">
                  <Zap className="h-2.5 w-2.5" />
                  Artifact généré
                </Badge>
              )}
              {isGeneratingArtifact && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 text-primary border-primary/30 shrink-0"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="inline-block"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                  </motion.span>
                  Génération…
                </Badge>
              )}
            </div>

            {/* Artifact body */}
            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                {/* Empty state */}
                {activeScenario === "idle" && !isGeneratingArtifact && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={motionTokens.transitions.fast}
                    className="flex flex-col items-center justify-center h-full gap-5 text-center"
                  >
                    <div className="p-6 rounded-2xl bg-muted/50 border border-dashed border-border">
                      <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Aucun artifact généré
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Posez une question à l'assistant pour générer une
                        visualisation de données interactive
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {QUICK_PROMPTS.map(({ id, label, icon: Icon, color, query }) => (
                        <button
                          key={id}
                          onClick={() => handleSend(query)}
                          disabled={isStreaming}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-border hover:bg-muted transition-colors disabled:opacity-40"
                        >
                          <Icon className={cn("h-3 w-3", color)} />
                          {label}
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Generating skeleton */}
                {isGeneratingArtifact && (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={motionTokens.transitions.fast}
                    className="flex flex-col items-center justify-center h-full gap-5"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Sparkles className="h-9 w-9 text-primary" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Génération de l'artifact…
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Analyse des données en cours
                      </p>
                    </div>
                    <div className="w-full max-w-sm space-y-2.5">
                      {[75, 55, 88, 45, 68].map((w, i) => (
                        <motion.div
                          key={i}
                          className="h-2 bg-muted rounded-full"
                          style={{ width: `${w}%` }}
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: i * 0.12,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Artifact content */}
                {!isGeneratingArtifact && currentScenario && (
                  <motion.div
                    key={activeScenario}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={motionTokens.transitions.default}
                    className="space-y-4 h-full"
                  >
                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      {currentScenario.metrics.map((metric, i) => (
                        <MetricCard key={i} metric={metric} index={i} />
                      ))}
                    </div>

                    {/* Chart card */}
                    <Card className="p-4">
                      <ArtifactChart scenario={activeScenario} />
                    </Card>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                      <span>
                        Source : Store FLOWZ · Données simulées pour la démo
                      </span>
                      <span>
                        Mis à jour :{" "}
                        {new Date().toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
