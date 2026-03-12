'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/design-system';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import {
  SettingsCard,
  SettingsHeader,
} from '@/components/settings/ui/SettingsCard';

export function ProfileDangerZoneSection() {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data');
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowz-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé', { description: 'Vos données ont été exportées avec succès.' });
    } catch (err: any) {
      toast.error("Erreur d'export", { description: err.message || 'Réessayez plus tard.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user.id },
      });

      if (error) {
        toast.error('La suppression de compte nécessite une action manuelle. Contactez le support.');
        return;
      }

      toast.success('Compte supprimé. À bientôt !');
      await signOut();
      router.push('/login');
    } catch (err) {
      toast.error('Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmed = confirmText === 'SUPPRIMER';

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Warning banner */}
      <motion.div
        variants={motionTokens.variants.staggerItem}
        className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20"
      >
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive/80">
          Les actions de cette section sont <strong>permanentes</strong> et ne peuvent pas être annulées.
        </p>
      </motion.div>

      {/* Export data card — RGPD */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard className="space-y-4">
          <SettingsHeader
            icon={Download}
            title="Exporter mes données"
            description="Téléchargez une copie de vos données (profil, produits, articles) au format JSON."
          />
          <p className="text-xs text-muted-foreground">
            Conformément au RGPD, vous avez le droit à la portabilité de vos données.
            L&apos;export inclut votre profil, vos boutiques (sans les credentials), vos produits et articles.
          </p>
          <Button
            variant="outline"
            className="h-8 text-[11px] rounded-lg gap-1.5 font-medium"
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />
            }
            {isExporting ? 'Export en cours...' : 'Télécharger mes données'}
          </Button>
        </SettingsCard>
      </motion.div>

      {/* Delete account card */}
      <motion.div variants={motionTokens.variants.staggerItem}>
        <SettingsCard variant="danger" className="space-y-4">
          <SettingsHeader
            icon={Trash2}
            title="Supprimer mon compte"
            description="Efface définitivement toutes vos données : produits, articles, boutiques, paramètres."
            iconClassName="text-destructive"
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto h-8 text-[11px] rounded-lg gap-1.5 font-medium">
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument certain ?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    Cette action supprimera définitivement votre compte et toutes vos données.
                    Vous ne pourrez pas récupérer vos produits, articles ou paramètres.
                  </span>
                  <span className="block font-medium text-foreground">
                    Tapez{' '}
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">SUPPRIMER</code>
                    {' '}pour confirmer :
                  </span>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="font-mono"
                    autoComplete="off"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={!isConfirmed || isDeleting}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}
