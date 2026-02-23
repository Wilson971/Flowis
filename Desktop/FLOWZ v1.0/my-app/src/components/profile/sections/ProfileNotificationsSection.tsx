'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { styles, motionTokens } from '@/lib/design-system';
import { motion } from 'framer-motion';
import { Shield, Mail, Bell } from 'lucide-react';
import { useUserProfile } from '@/hooks/profile/useUserProfile';

export function ProfileNotificationsSection() {
  const { profile, updateProfile } = useUserProfile();

  const emailEnabled = profile?.preferences?.notifications?.email ?? true;
  const pushEnabled = profile?.preferences?.notifications?.push ?? true;

  const handleToggle = (key: 'email' | 'push', value: boolean) => {
    if (!profile) return;
    updateProfile.mutate({
      preferences: {
        ...profile.preferences,
        notifications: {
          email: key === 'email' ? value : emailEnabled,
          push: key === 'push' ? value : pushEnabled,
        },
      },
    });
  };

  const rows = [
    {
      key: 'email' as const,
      icon: Mail,
      label: 'Notifications email',
      description: 'Synchronisation produits, publications blog, rapports.',
      value: emailEnabled,
      disabled: false,
      badge: null,
    },
    {
      key: 'push' as const,
      icon: Bell,
      label: 'Notifications push',
      description: "Activité en temps réel dans l'interface.",
      value: pushEnabled,
      disabled: false,
      badge: null,
    },
    {
      key: null,
      icon: Shield,
      label: 'Alertes de sécurité',
      description: 'Connexions suspectes et changements de mot de passe.',
      value: true,
      disabled: true,
      badge: 'Toujours actif',
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
        <h2 className={styles.text.h2}>Notifications</h2>
        <p className={styles.text.bodyMuted}>Gérez vos préférences de notifications.</p>
      </motion.div>

      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6')}>
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Canaux de notification</h3>
            <p className={styles.text.bodySmall}>Choisissez comment vous souhaitez être notifié.</p>
          </div>
        </div>

        <div className="space-y-1 divide-y divide-border/40">
          {rows.map(({ key, icon: Icon, label, description, value, disabled, badge }) => (
            <div key={label} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                <div className={cn(styles.iconContainer.sm, 'bg-muted/60 shrink-0 mt-0.5')}>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className={cn(styles.text.label, disabled && 'text-muted-foreground')}>
                      {label}
                    </Label>
                    {badge && (
                      <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
                    )}
                  </div>
                  <p className={cn(styles.text.bodySmall, 'mt-0.5')}>{description}</p>
                </div>
              </div>
              <Switch
                checked={value}
                disabled={disabled || updateProfile.isPending}
                onCheckedChange={key ? (v) => handleToggle(key, v) : undefined}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
