'use client';

/**
 * WordPressSyncDialog Component
 *
 * Full dialog for WordPress sync configuration and push:
 * - Connection settings (credentials only, URL from store)
 * - Test connection
 * - Push options (status, category, tags)
 * - Sync history
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  Settings,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Key,
  Globe,
  FolderOpen,
  Tag,
  Send,
  RefreshCw,
  Store,
  Link as LinkIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  useWordPressSync,
  type WordPressBlogConfig,
} from '@/hooks/blog/useWordPressSync';

// ============================================================================
// TYPES
// ============================================================================

interface WordPressSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
}

// ============================================================================
// CONFIG TAB
// ============================================================================

interface ConfigTabProps {
  config: (WordPressBlogConfig & { wp_site_url: string | null; site_name: string | null }) | null;
  siteUrl: string | null;
  siteName: string | null;
  onSave: (data: {
    wp_username: string;
    wp_app_password: string;
    default_status?: 'draft' | 'publish' | 'pending';
    sync_featured_images?: boolean;
    sync_categories?: boolean;
    sync_tags?: boolean;
  }) => Promise<void>;
  onTest: (data: { wp_username: string; wp_app_password: string }) => Promise<void>;
  isSaving: boolean;
  isTesting: boolean;
}

function ConfigTab({ config, siteUrl, siteName, onSave, onTest, isSaving, isTesting }: ConfigTabProps) {
  const [formData, setFormData] = useState({
    wp_username: config?.wp_username || '',
    wp_app_password: config?.wp_app_password || '',
    default_status: config?.default_status || 'draft',
    sync_featured_images: config?.sync_featured_images ?? true,
    sync_categories: config?.sync_categories ?? true,
    sync_tags: config?.sync_tags ?? true,
  });

  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setTestResult(null);
    try {
      await onTest({
        wp_username: formData.wp_username,
        wp_app_password: formData.wp_app_password,
      });
      setTestResult('success');
    } catch {
      setTestResult('error');
    }
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  // Show warning if no store URL configured
  if (!siteUrl) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
        <p className="font-medium text-foreground mb-2">URL du site non configuree</p>
        <p className="text-sm text-muted-foreground mb-4">
          L'URL de votre site WordPress doit etre configuree dans les parametres du store.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="/app/settings/stores">
            <Store className="w-4 h-4 mr-2" />
            Configurer le store
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Store Info (read-only) */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Store className="w-4 h-4" />
          Site WordPress
        </h4>

        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{siteName || 'Store actif'}</span>
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-muted-foreground" />
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate"
            >
              {siteUrl}
            </a>
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Key className="w-4 h-4" />
          Identifiants WordPress REST API
        </h4>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wp_username" className="text-xs">Nom d'utilisateur WordPress</Label>
            <Input
              id="wp_username"
              value={formData.wp_username}
              onChange={(e) => setFormData({ ...formData, wp_username: e.target.value })}
              placeholder="admin"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wp_app_password" className="text-xs">
              Mot de passe d'application
              <a
                href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Aide
              </a>
            </Label>
            <Input
              id="wp_app_password"
              type="password"
              value={formData.wp_app_password}
              onChange={(e) => setFormData({ ...formData, wp_app_password: e.target.value })}
              placeholder="xxxx xxxx xxxx xxxx"
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Creez un mot de passe d'application dans WordPress: Utilisateurs → Profil → Mots de passe d'application
            </p>
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || !formData.wp_username || !formData.wp_app_password}
            className="gap-2"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Tester la connexion
          </Button>

          <AnimatePresence>
            {testResult === 'success' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-emerald-600 text-xs"
              >
                <Check className="w-4 h-4" />
                Connexion reussie
              </motion.div>
            )}
            {testResult === 'error' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-red-600 text-xs"
              >
                <AlertCircle className="w-4 h-4" />
                Echec de connexion
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Default Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Parametres par defaut
        </h4>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Statut par defaut</Label>
            <Select
              value={formData.default_status}
              onValueChange={(value) =>
                setFormData({ ...formData, default_status: value as 'draft' | 'publish' | 'pending' })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="publish">Publie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-xs">Synchroniser les images</Label>
            <Switch
              checked={formData.sync_featured_images}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sync_featured_images: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-xs">Synchroniser les categories</Label>
            <Switch
              checked={formData.sync_categories}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sync_categories: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-xs">Synchroniser les tags</Label>
            <Switch
              checked={formData.sync_tags}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, sync_tags: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || !formData.wp_username || !formData.wp_app_password}
        className="w-full"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        Sauvegarder
      </Button>
    </div>
  );
}

// ============================================================================
// PUSH TAB
// ============================================================================

interface PushTabProps {
  articleId: string;
  isConfigured: boolean;
  siteUrl: string | null;
  categories: Array<{ id: number; name: string }>;
  defaultStatus: 'draft' | 'publish' | 'pending';
  defaultCategoryId: number | null;
  isSynced: boolean;
  wordpressPostId: string | null;
  lastSyncedAt: string | null;
  onPush: (params: {
    articleId: string;
    status?: 'draft' | 'publish' | 'pending';
    categoryId?: number;
  }) => Promise<void>;
  isPushing: boolean;
  onClose: () => void;
}

function PushTab({
  articleId,
  isConfigured,
  siteUrl,
  categories,
  defaultStatus,
  defaultCategoryId,
  isSynced,
  wordpressPostId,
  lastSyncedAt,
  onPush,
  isPushing,
  onClose,
}: PushTabProps) {
  const [status, setStatus] = useState<'draft' | 'publish' | 'pending'>(defaultStatus);
  const [categoryId, setCategoryId] = useState<number | undefined>(defaultCategoryId ?? undefined);

  const handlePush = async () => {
    await onPush({
      articleId,
      status,
      categoryId,
    });
    onClose();
  };

  const wordpressUrl = wordpressPostId && siteUrl
    ? `${siteUrl}/wp-admin/post.php?post=${wordpressPostId}&action=edit`
    : null;

  if (!isConfigured) {
    return (
      <div className="py-12 text-center">
        <Cloud className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground mb-4">
          Configurez d'abord votre connexion WordPress
        </p>
        <p className="text-xs text-muted-foreground">
          Allez dans l'onglet "Configuration" pour ajouter vos identifiants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Current Status */}
      {isSynced && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-900">Deja synchronise</p>
              <p className="text-xs text-emerald-700">
                Derniere sync: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('fr-FR') : 'N/A'}
              </p>
            </div>
            {wordpressUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(wordpressUrl, '_blank')}
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Push Options */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Send className="w-4 h-4" />
          Options de publication
        </h4>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" />
              Statut WordPress
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending">En attente de relecture</SelectItem>
                <SelectItem value="publish">Publie immediatement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Categorie
              </Label>
              <Select
                value={categoryId?.toString() || 'none'}
                onValueChange={(v) => setCategoryId(v === 'none' ? undefined : parseInt(v))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Aucune categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune categorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Push Button */}
      <Button
        onClick={handlePush}
        disabled={isPushing}
        className="w-full"
        size="lg"
      >
        {isPushing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Cloud className="w-4 h-4 mr-2" />
        )}
        {isSynced ? 'Resynchroniser' : 'Pousser vers WordPress'}
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WordPressSyncDialog({ open, onOpenChange, articleId }: WordPressSyncDialogProps) {
  const [activeTab, setActiveTab] = useState<'push' | 'config'>('push');

  const {
    config,
    siteUrl,
    siteName,
    isConfigured,
    saveConfig,
    isSavingConfig,
    testConnection,
    isTestingConnection,
    categories,
    isSynced,
    wordpressPostId,
    lastSyncedAt,
    pushToWordPress,
    isPushing,
  } = useWordPressSync({ articleId });

  // Switch to config tab if not configured
  useEffect(() => {
    if (open && !isConfigured) {
      setActiveTab('config');
    }
  }, [open, isConfigured]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Synchronisation WordPress</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isConfigured ? siteName : siteUrl ? 'Configurez vos identifiants' : 'URL non configuree'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="push" className="gap-2">
              <Send className="w-4 h-4" />
              Publier
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="push">
            <PushTab
              articleId={articleId}
              isConfigured={isConfigured}
              siteUrl={siteUrl}
              categories={categories}
              defaultStatus={config?.default_status || 'draft'}
              defaultCategoryId={config?.default_category_id ?? null}
              isSynced={isSynced}
              wordpressPostId={wordpressPostId ?? null}
              lastSyncedAt={lastSyncedAt ?? null}
              onPush={pushToWordPress}
              isPushing={isPushing}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="config">
            <ConfigTab
              config={config}
              siteUrl={siteUrl}
              siteName={siteName}
              onSave={saveConfig}
              onTest={testConnection}
              isSaving={isSavingConfig}
              isTesting={isTestingConnection}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default WordPressSyncDialog;
