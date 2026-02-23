'use client';

import { useEffect, useRef } from 'react';
import { useTheme, THEME_PALETTES } from '@/contexts/ThemeContext';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { styles, motionTokens } from '@/lib/design-system';
import { motion } from 'framer-motion';
import { Check, Moon, Sun, Monitor, Palette, Layout } from 'lucide-react';
import { useUserProfile } from '@/hooks/profile/useUserProfile';

export function ProfilePreferencesSection() {
  const { theme, setTheme, palette, setBrandTheme, radius, setRadius } = useTheme();
  const { profile, updateAppearance } = useUserProfile();
  const didSyncRef = useRef(false);

  // Sync from DB on first mount (cross-device persistence)
  useEffect(() => {
    if (!profile || didSyncRef.current) return;
    didSyncRef.current = true;
    const appearance = (profile?.preferences?.notifications as any)?.appearance;
    if (!appearance) return;
    if (appearance.brand_theme) setBrandTheme(appearance.brand_theme);
    if (typeof appearance.radius === 'number') setRadius(appearance.radius);
    if (appearance.theme === 'light' || appearance.theme === 'dark') setTheme(appearance.theme);
  }, [profile?.id]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    updateAppearance.mutate({ theme: newTheme });
  };

  const handleBrandThemeChange = (newBrandTheme: string) => {
    setBrandTheme(newBrandTheme as any);
    updateAppearance.mutate({ brand_theme: newBrandTheme });
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    updateAppearance.mutate({ radius: newRadius });
  };

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Apparence</h2>
        <p className={styles.text.bodyMuted}>Personnalisez l&apos;interface selon vos goûts.</p>
      </motion.div>

      {/* Display mode */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Monitor className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Mode d&apos;affichage</h3>
            <p className={styles.text.bodySmall}>Clair ou sombre selon votre préférence.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'light', name: 'Clair', icon: Sun },
            { id: 'dark', name: 'Sombre', icon: Moon },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleThemeChange(mode.id as 'light' | 'dark')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 transition-all duration-200",
                theme === mode.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/50 hover:border-primary/40 hover:bg-muted/40"
              )}
            >
              <mode.icon className={cn("w-5 h-5", theme === mode.id ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-xs font-semibold", theme === mode.id ? "text-primary" : "text-muted-foreground")}>
                {mode.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Color palette */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Palette de couleurs</h3>
            <p className={styles.text.bodySmall}>Choisissez la couleur principale de l&apos;interface.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {THEME_PALETTES.map((p) => (
            <button
              key={p.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200",
                palette.id === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/30 hover:bg-muted/40"
              )}
              onClick={() => handleBrandThemeChange(p.id)}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm shrink-0"
                style={{ backgroundColor: p.previewColor }}
              />
              <p className={cn(
                "text-sm font-medium flex-1",
                palette.id === p.id ? "text-primary" : "text-foreground"
              )}>
                {p.name}
              </p>
              {palette.id === p.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Border radius */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
              <Layout className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className={styles.text.h4}>Style des bordures</h3>
              <p className={styles.text.bodySmall}>Arrondis des composants.</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-muted px-2 py-1 rounded-lg text-muted-foreground font-bold tracking-widest">
            {radius}px
          </span>
        </div>

        <div className="space-y-4">
          <Slider
            value={[radius]}
            min={0}
            max={24}
            step={2}
            onValueChange={(val) => handleRadiusChange(val[0])}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            <span>Sharp</span>
            <span>Default</span>
            <span>Rounded</span>
          </div>
        </div>

        {/* Preview */}
        <div className="pt-3 border-t border-border/30">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Aperçu</p>
          <div className="flex gap-3">
            <div
              className="h-14 w-28 border-2 border-primary/20 bg-primary/5 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight text-primary transition-all duration-300"
              style={{ borderRadius: `${radius}px` }}
            >
              Bouton
            </div>
            <div
              className="h-14 flex-1 border border-border/50 bg-muted/30 flex items-center justify-center text-[10px] font-bold uppercase tracking-tight text-muted-foreground transition-all duration-300"
              style={{ borderRadius: `${radius}px` }}
            >
              Carte
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
