'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { styles, motionTokens } from '@/lib/design-system';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Languages, PenLine, Mic2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/profile/useUserProfile';

const AI_LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
];

const AI_STYLES = [
  { value: 'Journalistique', label: 'Journalistique' },
  { value: 'Académique', label: 'Académique' },
  { value: 'Tutorial', label: 'Tutorial' },
  { value: 'Storytelling', label: 'Storytelling' },
  { value: 'Blog Lifestyle', label: 'Blog Lifestyle' },
];

const AI_TONES = [
  { value: 'Expert', label: 'Expert' },
  { value: 'Narratif', label: 'Narratif' },
  { value: 'Minimaliste', label: 'Minimaliste' },
  { value: 'Inspirant', label: 'Inspirant' },
  { value: 'Conversationnel', label: 'Conversationnel' },
];

export function ProfileAISection() {
  const { profile, updateProfile } = useUserProfile();
  const aiDefaults = (profile?.preferences as any)?.ai_defaults ?? {};

  const [language, setLanguage] = useState<string>(aiDefaults.language ?? 'fr');
  const [style, setStyle] = useState<string>(aiDefaults.style ?? 'Journalistique');
  const [tone, setTone] = useState<string>(aiDefaults.tone ?? 'Expert');

  const handleSave = () => {
    if (!profile) return;
    updateProfile.mutate({
      preferences: {
        ...profile.preferences,
        ai_defaults: { language, style, tone },
      } as any,
    });
  };

  const aiFields = [
    {
      label: 'Langue de génération',
      icon: Languages,
      value: language,
      onChange: setLanguage,
      options: AI_LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
    },
    {
      label: "Style d'écriture par défaut",
      icon: PenLine,
      value: style,
      onChange: setStyle,
      options: AI_STYLES.map((s) => ({ value: s.value, label: s.label })),
    },
    {
      label: 'Ton par défaut',
      icon: Mic2,
      value: tone,
      onChange: setTone,
      options: AI_TONES.map((t) => ({ value: t.value, label: t.label })),
    },
  ];

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Intelligence Artificielle</h2>
        <p className={styles.text.bodyMuted}>
          Configurez les valeurs par défaut de FloWriter.
        </p>
      </motion.div>

      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-5')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Paramètres FloWriter par défaut</h3>
            <p className={styles.text.bodySmall}>Pré-remplissent automatiquement le wizard de génération.</p>
          </div>
        </div>

        <div className="space-y-4">
          {aiFields.map(({ label, icon: Icon, value, onChange, options }) => (
            <div key={label} className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </Label>
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button onClick={handleSave} disabled={updateProfile.isPending} className="rounded-lg">
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les préférences
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
