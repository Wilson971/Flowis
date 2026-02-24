'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { styles, motionTokens } from '@/lib/design-system';
import { motion } from 'framer-motion';
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Lock,
  Smartphone,
  LogOut,
  QrCode,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { changePasswordSchema, type ChangePasswordFormData } from '../schemas';

export function ProfileSecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const supabase = createClient();
  const { signOut } = useAuth();
  const { user } = useAuth();
  const router = useRouter();

  // ── Password form ──────────────────────────
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email) {
      toast.error("Impossible de récupérer l'email utilisateur");
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: data.currentPassword,
    });
    if (signInError) {
      form.setError('currentPassword', { message: 'Mot de passe actuel incorrect' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) {
      toast.error('Erreur lors du changement de mot de passe');
      return;
    }
    toast.success('Mot de passe mis à jour');
    form.reset();
  };

  // ── 2FA state machine ──────────────────────
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrollData, setEnrollData] = useState<{ qr_code: string; secret: string; factorId: string } | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaActionLoading, setMfaActionLoading] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const checkMFA = async () => {
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const verified = data?.totp?.find(f => f.status === 'verified');
        if (verified) {
          setMfaEnrolled(true);
          setMfaFactorId(verified.id);
        }
      } catch {
        // MFA not available or error — silently fail
      } finally {
        setMfaLoading(false);
      }
    };
    checkMFA();
  }, []);

  const handleEnroll2FA = async () => {
    setMfaActionLoading(true);
    try {
      const { data: enrollResult, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (enrollError) throw enrollError;

      const { data: challengeResult, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollResult.id });
      if (challengeError) throw challengeError;

      setEnrollData({
        qr_code: enrollResult.totp.qr_code,
        secret: enrollResult.totp.secret,
        factorId: enrollResult.id,
      });
      setChallengeId(challengeResult.id);
    } catch (err: any) {
      toast.error("Erreur d'activation 2FA", { description: err.message });
    } finally {
      setMfaActionLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!enrollData || !challengeId) return;
    setMfaActionLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollData.factorId,
        challengeId,
        code: totpCode.replace(/\s/g, ''),
      });
      if (error) throw error;
      toast.success('2FA activée avec succès', { description: 'Votre compte est maintenant mieux protégé.' });
      setMfaEnrolled(true);
      setMfaFactorId(enrollData.factorId);
      setEnrollData(null);
      setChallengeId(null);
      setTotpCode('');
    } catch {
      toast.error('Code incorrect', { description: 'Vérifiez le code dans votre application TOTP.' });
    } finally {
      setMfaActionLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!mfaFactorId) return;
    setMfaActionLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
      if (error) throw error;
      toast.success('2FA désactivée');
      setMfaEnrolled(false);
      setMfaFactorId(null);
      setShowDisable2FADialog(false);
    } catch (err: any) {
      toast.error('Erreur de désactivation', { description: err.message });
    } finally {
      setMfaActionLoading(false);
    }
  };

  // ── Session management ─────────────────────
  const [sessionLoading, setSessionLoading] = useState(false);

  const handleSignOutOthers = async () => {
    setSessionLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'others' });
      toast.success('Autres sessions terminées', { description: 'Seule votre session actuelle reste active.' });
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setSessionLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      await signOut();
      router.push('/login');
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
      setSessionLoading(false);
    }
  };

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <motion.div
      className="space-y-4 w-full"
      variants={motionTokens.variants.staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={motionTokens.variants.staggerItem} className="space-y-1">
        <h2 className={styles.text.h2}>Sécurité</h2>
        <p className={styles.text.bodyMuted}>Gérez votre mot de passe et la sécurité de votre compte.</p>
      </motion.div>

      {/* Password card */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-5')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Changer le mot de passe</h3>
            <p className={styles.text.bodySmall}>Au moins 8 caractères, une majuscule et un chiffre.</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: 'currentPassword' as const, label: 'Mot de passe actuel', show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
              { name: 'newPassword' as const, label: 'Nouveau mot de passe', show: showNew, toggle: () => setShowNew(!showNew) },
              { name: 'confirmPassword' as const, label: 'Confirmer le nouveau mot de passe', show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
            ].map(({ name, label, show, toggle }) => (
              <FormField
                key={name}
                name={name}
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={show ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={toggle}
                          tabIndex={-1}
                        >
                          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-lg">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>

      {/* 2FA card */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, mfaEnrolled ? 'bg-emerald-500/10' : 'bg-primary/10')}>
            <Shield className={cn('h-4 w-4', mfaEnrolled ? 'text-emerald-600' : 'text-primary')} />
          </div>
          <div className="flex-1">
            <h3 className={styles.text.h4}>Authentification à deux facteurs</h3>
            <p className={styles.text.bodySmall}>Protégez votre compte avec une app TOTP (Google Authenticator, Authy…)</p>
          </div>
          {mfaLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : mfaEnrolled ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs shrink-0">Activée</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">Désactivée</Badge>
          )}
        </div>

        {!mfaLoading && !mfaEnrolled && !enrollData && (
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={handleEnroll2FA}
            disabled={mfaActionLoading}
          >
            {mfaActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            Activer la 2FA
          </Button>
        )}

        {enrollData && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <p className={styles.text.bodySmall}>
              Scannez le QR code avec votre application TOTP, puis saisissez le code à 6 chiffres généré.
            </p>
            <div className="flex justify-center">
              {/* QR code is a data URI SVG returned by Supabase */}
              <img
                src={enrollData.qr_code}
                alt="QR Code 2FA"
                className="w-44 h-44 rounded-xl border border-border/50 p-2 bg-white"
              />
            </div>

            {/* Manual secret */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clé manuelle</p>
              <div className="flex items-center gap-2">
                <code className={cn('font-mono text-xs flex-1 truncate', !showSecret && 'blur-sm select-none')}>
                  {enrollData.secret}
                </code>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => { navigator.clipboard.writeText(enrollData.secret); toast.success('Clé copiée'); }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000 000"
                className="font-mono tracking-widest text-center text-lg rounded-lg"
                maxLength={6}
                onKeyDown={e => { if (e.key === 'Enter' && totpCode.length === 6) handleVerify2FA(); }}
              />
              <Button
                className="rounded-lg shrink-0"
                onClick={handleVerify2FA}
                disabled={totpCode.length !== 6 || mfaActionLoading}
              >
                {mfaActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Vérifier
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground rounded-lg"
              onClick={() => { setEnrollData(null); setChallengeId(null); setTotpCode(''); }}
            >
              Annuler
            </Button>
          </div>
        )}

        {!mfaLoading && mfaEnrolled && (
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <p className={cn(styles.text.bodySmall, 'text-emerald-600')}>2FA activée — votre compte est protégé</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-destructive hover:bg-destructive/5 border-destructive/20"
              onClick={() => setShowDisable2FADialog(true)}
            >
              Désactiver
            </Button>
          </div>
        )}
      </motion.div>

      {/* Sessions card */}
      <motion.div variants={motionTokens.variants.staggerItem} className={cn(styles.card.glass, 'p-6 space-y-4')}>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-primary/10')}>
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className={styles.text.h4}>Sessions actives</h3>
            <p className={styles.text.bodySmall}>Gérez les connexions actives sur vos appareils.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 p-3 flex items-center gap-3">
          <div className={cn(styles.iconContainer.sm, 'bg-emerald-500/10 shrink-0')}>
            <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(styles.text.label, 'text-sm')}>Session actuelle</p>
            {lastSignIn && (
              <p className={cn(styles.text.bodySmall, 'text-xs truncate')}>Dernière connexion : {lastSignIn}</p>
            )}
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs shrink-0">Actif</Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="rounded-lg flex-1"
            disabled={sessionLoading}
            onClick={handleSignOutOthers}
          >
            {sessionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Déconnecter les autres appareils
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-lg text-destructive border-destructive/20 hover:bg-destructive/5"
                disabled={sessionLoading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnecter partout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Déconnecter partout ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous serez déconnecté de tous vos appareils, y compris cet appareil.
                  Vous devrez vous reconnecter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignOutAll}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Déconnecter partout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>

      {/* Disable 2FA Dialog */}
      <AlertDialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver la 2FA ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre compte sera moins sécurisé. Vous pourrez la réactiver à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              disabled={mfaActionLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {mfaActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
