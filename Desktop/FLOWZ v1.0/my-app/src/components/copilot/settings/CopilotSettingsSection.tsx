"use client"

import { useState } from "react"
import { Sparkles, Shield, Bell, Keyboard, Brain, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SettingsCard, SettingsHeader } from "@/components/settings/ui/SettingsCard"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useCopilotSettings } from "@/hooks/copilot/useCopilotSettings"
import { useCopilotMemory } from "@/hooks/copilot/useCopilotMemory"

// ── Radio Option ─────────────────────────────────────────────
function RadioOption({
  value,
  selected,
  onSelect,
  label,
}: {
  value: string
  selected: boolean
  onSelect: (v: string) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}

// ── Autonomy Row ─────────────────────────────────────────────
function AutonomyRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: "auto" | "confirm"
  onChange: (v: "auto" | "confirm") => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Label className="text-xs text-muted-foreground">Confirmer</Label>
        <Switch
          checked={value === "auto"}
          onCheckedChange={(checked) => onChange(checked ? "auto" : "confirm")}
        />
        <Label className="text-xs text-muted-foreground">Auto</Label>
      </div>
    </div>
  )
}

// ── Notification Type Row ────────────────────────────────────
function NotifTypeRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-[13px] text-foreground cursor-pointer">
        {label}
      </Label>
    </div>
  )
}

// ── Shortcut Row ─────────────────────────────────────────────
function ShortcutRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-foreground">{label}</span>
      <Badge variant="secondary" className="font-mono text-[11px]">
        {keys}
      </Badge>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────
export function CopilotSettingsSection() {
  const { settings, updateSettings } = useCopilotSettings()
  const { items: memoryItems, deleteMemory, clearAll } = useCopilotMemory()
  const [confirmClear, setConfirmClear] = useState(false)

  // ── Personality ──────────────────────────────────────────
  const styleOptions = [
    { value: "concise", label: "Concis" },
    { value: "balanced", label: "Equilibre" },
    { value: "detailed", label: "Detaille" },
  ]
  const toneOptions = [
    { value: "formal", label: "Formel" },
    { value: "friendly", label: "Friendly" },
  ]

  // ── Notification types config ────────────────────────────
  const notifTypes = [
    { key: "seo_critical" as const, label: "SEO critique (score < 50)" },
    { key: "drafts_forgotten" as const, label: "Brouillons oublies (> 7 jours)" },
    { key: "gsc_performance" as const, label: "Performance GSC (baisse > 10%)" },
    { key: "sync_failed" as const, label: "Sync echouees" },
    { key: "batch_complete" as const, label: "Batch termines" },
    { key: "products_unpublished" as const, label: "Produits non publies" },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Personnalite */}
      <SettingsCard>
        <SettingsHeader
          icon={Sparkles}
          title="Personnalite"
          description="Style et ton des reponses"
        />
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Style</Label>
            <div className="flex gap-2">
              {styleOptions.map((opt) => (
                <RadioOption
                  key={opt.value}
                  value={opt.value}
                  selected={settings.personality.style === opt.value}
                  onSelect={(v) =>
                    updateSettings({ personality: { ...settings.personality, style: v as "concise" | "balanced" | "detailed" } })
                  }
                  label={opt.label}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ton</Label>
            <div className="flex gap-2">
              {toneOptions.map((opt) => (
                <RadioOption
                  key={opt.value}
                  value={opt.value}
                  selected={settings.personality.tone === opt.value}
                  onSelect={(v) =>
                    updateSettings({ personality: { ...settings.personality, tone: v as "formal" | "friendly" } })
                  }
                  label={opt.label}
                />
              ))}
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* 2. Autonomie */}
      <SettingsCard>
        <SettingsHeader
          icon={Shield}
          title="Autonomie"
          description="Controle le niveau d'autonomie du Copilot"
        />
        <div className="mt-4 space-y-4">
          <AutonomyRow
            label="Actions legeres"
            description="Analyser, auditer"
            value={settings.autonomy.light}
            onChange={(v) => updateSettings({ autonomy: { ...settings.autonomy, light: v } })}
          />
          <AutonomyRow
            label="Actions moyennes"
            description="Reecrire, generer"
            value={settings.autonomy.medium}
            onChange={(v) => updateSettings({ autonomy: { ...settings.autonomy, medium: v } })}
          />
          <AutonomyRow
            label="Actions lourdes"
            description="Publier, push, batch"
            value={settings.autonomy.heavy}
            onChange={(v) => updateSettings({ autonomy: { ...settings.autonomy, heavy: v } })}
          />
          <p className="text-[11px] text-muted-foreground/60 italic">
            Certaines actions (supprimer, push prod) demandent toujours confirmation.
          </p>
        </div>
      </SettingsCard>

      {/* 3. Notifications proactives */}
      <SettingsCard>
        <SettingsHeader
          icon={Bell}
          title="Notifications proactives"
          description="Suggestions automatiques du Copilot"
        />
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[13px] font-medium text-foreground">
              Activer les suggestions proactives
            </Label>
            <Switch
              checked={settings.notifications.enabled}
              onCheckedChange={(checked) =>
                updateSettings({ notifications: { ...settings.notifications, enabled: checked } })
              }
            />
          </div>
          {settings.notifications.enabled && (
            <div className="space-y-3 pl-1">
              {notifTypes.map((nt) => (
                <NotifTypeRow
                  key={nt.key}
                  id={`notif-${nt.key}`}
                  label={nt.label}
                  checked={settings.notifications.types[nt.key]}
                  onChange={(v) =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        types: { ...settings.notifications.types, [nt.key]: v },
                      },
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </SettingsCard>

      {/* 4. Raccourcis */}
      <SettingsCard>
        <SettingsHeader
          icon={Keyboard}
          title="Raccourcis"
          description="Raccourcis clavier du Copilot"
        />
        <div className="mt-4 space-y-3">
          <ShortcutRow label="Spotlight" keys="Ctrl+K" />
          <ShortcutRow label="Panel" keys="Ctrl+Shift+K" />
          <ShortcutRow label="Nouvelle conversation" keys="Ctrl+Shift+N" />
        </div>
      </SettingsCard>

      {/* 5. Memoire */}
      <SettingsCard>
        <SettingsHeader
          icon={Brain}
          title="Memoire"
          description="Preferences memorisees par le Copilot"
        />
        <div className="mt-4 space-y-3">
          {memoryItems.length === 0 ? (
            <p className="text-[13px] text-muted-foreground italic">
              Le Copilot n&apos;a pas encore memorise de preferences.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {memoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <span className="text-[13px] text-foreground truncate">{item.content}</span>
                    <button
                      type="button"
                      onClick={() => deleteMemory(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {!confirmClear ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Tout effacer
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      clearAll()
                      setConfirmClear(false)
                    }}
                  >
                    Confirmer la suppression
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmClear(false)}
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SettingsCard>
    </div>
  )
}
