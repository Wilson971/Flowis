import { useState, useEffect, useCallback } from 'react';
import { createClient } from "@/lib/supabase/client";

/**
 * Clé publique VAPID - doit être configurée dans les variables d'environnement
 */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
// Adjusted to check both process.env and import.meta.env just in case, or stick to what the project uses. 
// Next.js uses process.env.NEXT_PUBLIC_... usually. 
// Old project used VITE_VAPID_PUBLIC_KEY.
// I will assume NEXT_PUBLIC_VAPID_PUBLIC_KEY is the way forward for Next.js.
// But I'll leave the fallback to VITE just in case.

type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

type PushSubscriptionData = {
    id: string;
    endpoint: string;
    user_agent: string | null;
    device_name: string | null;
    created_at: string;
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [permissionState, setPermissionState] = useState<PermissionState>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [subscriptions, setSubscriptions] = useState<PushSubscriptionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    const supabase = createClient();

    const checkSupport = useCallback((): boolean => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
        const supported =
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;

        setIsSupported(supported);

        if (!supported) {
            setPermissionState('unsupported');
        }

        return supported;
    }, []);

    const getPermissionState = useCallback((): PermissionState => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission as PermissionState;
    }, []);

    const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
            return null;
        }

        try {
            // In Next.js, the SW is usually at /sw.js or public/sw.js served at root.
            const reg = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[Push] Service Worker registered:', reg.scope);
            setRegistration(reg);

            if (reg.active && VAPID_PUBLIC_KEY) {
                reg.active.postMessage({
                    type: 'SET_VAPID_KEY',
                    vapidPublicKey: VAPID_PUBLIC_KEY
                });
            }

            return reg;
        } catch (err) {
            console.error('[Push] Service Worker registration failed:', err);
            setError('Impossible d\'enregistrer le Service Worker');
            return null;
        }
    }, []);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setError('Les notifications ne sont pas supportées');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermissionState(permission as PermissionState);

            if (permission === 'granted') {
                return true;
            } else if (permission === 'denied') {
                setError('Notifications refusées');
                return false;
            } else {
                return false;
            }
        } catch (err) {
            setError('Erreur lors de la demande de permission');
            return false;
        }
    }, []);

    const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
        if (!VAPID_PUBLIC_KEY) {
            setError('Configuration VAPID manquante');
            return null;
        }

        try {
            let reg = registration;
            if (!reg) {
                reg = await registerServiceWorker();
                if (!reg) return null;
            }

            if (!reg.active) {
                await new Promise<void>((resolve) => {
                    if (!reg) return resolve();
                    if (reg.installing) {
                        reg.installing.addEventListener('statechange', (e) => {
                            if ((e.target as ServiceWorker).state === 'activated') resolve();
                        });
                    } else if (reg.waiting) {
                        reg.waiting.addEventListener('statechange', (e) => {
                            if ((e.target as ServiceWorker).state === 'activated') resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            }

            const pushSubscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            setSubscription(pushSubscription);
            setIsSubscribed(true);

            return pushSubscription;
        } catch (err) {
            console.error('[Push] Subscription error:', err);
            setError('Erreur lors de l\'abonnement');
            return null;
        }
    }, [registration, registerServiceWorker]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        try {
            if (subscription) {
                await subscription.unsubscribe();
            }

            setSubscription(null);
            setIsSubscribed(false);
            return true;
        } catch (err) {
            setError('Erreur lors du désabonnement');
            return false;
        }
    }, [subscription]);

    const getDeviceName = (): string => {
        if (typeof navigator === 'undefined') return 'Unknown';
        const ua = navigator.userAgent;
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/iPad/.test(ua)) return 'iPad';
        if (/Android/.test(ua)) return 'Android';
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Mac/.test(ua)) return 'Mac';
        if (/Linux/.test(ua)) return 'Linux';
        return 'Appareil inconnu';
    };

    const saveSubscription = useCallback(async (pushSub: PushSubscription): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Utilisateur non connecté');
                return false;
            }

            const subscriptionJson = pushSub.toJSON();
            const keys = subscriptionJson.keys as { p256dh: string; auth: string } | undefined;

            if (!keys?.p256dh || !keys?.auth) {
                setError('Données de subscription invalides');
                return false;
            }

            const { error: insertError } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: pushSub.endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    user_agent: navigator.userAgent,
                    device_name: getDeviceName()
                }, {
                    onConflict: 'endpoint'
                });

            if (insertError) {
                setError('Erreur lors de la sauvegarde de l\'abonnement');
                return false;
            }

            await fetchSubscriptions();
            return true;
        } catch (err) {
            setError('Erreur lors de la sauvegarde');
            return false;
        }
    }, [supabase]);

    const removeSubscription = useCallback(async (endpoint?: string): Promise<boolean> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const targetEndpoint = endpoint || subscription?.endpoint;
            if (!targetEndpoint) return true;

            const { error: deleteError } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .eq('endpoint', targetEndpoint);

            if (deleteError) return false;

            await fetchSubscriptions();
            return true;
        } catch (err) {
            return false;
        }
    }, [subscription, supabase]);

    const fetchSubscriptions = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setSubscriptions([]);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('push_subscriptions')
                .select('id, endpoint, user_agent, device_name, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) {
                if (fetchError.code === 'PGRST205') {
                    setSubscriptions([]);
                    return;
                }
                throw fetchError;
            }

            setSubscriptions(data || []);
        } catch (err) {
            console.error('[Push] Error fetching subscriptions:', err);
        }
    }, [supabase]);

    const enablePushNotifications = useCallback(async (): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            if (!checkSupport()) {
                setError('Navigateur incompatible');
                return false;
            }

            const permissionGranted = await requestPermission();
            if (!permissionGranted) return false;

            const pushSub = await subscribe();
            if (!pushSub) return false;

            const saved = await saveSubscription(pushSub);
            if (!saved) {
                await unsubscribe();
                return false;
            }

            return true;
        } catch (err) {
            setError('Erreur activation');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [checkSupport, requestPermission, subscribe, saveSubscription, unsubscribe]);

    const disablePushNotifications = useCallback(async (): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            await unsubscribe();
            await removeSubscription();
            return true;
        } catch (err) {
            setError('Erreur désactivation');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [unsubscribe, removeSubscription]);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const supported = checkSupport();
            if (!supported) {
                setIsLoading(false);
                return;
            }

            setPermissionState(getPermissionState());

            const reg = await registerServiceWorker();
            if (reg) {
                const existingSubscription = await reg.pushManager.getSubscription();
                if (existingSubscription) {
                    setSubscription(existingSubscription);
                    setIsSubscribed(true);
                }
            }

            await fetchSubscriptions();
            setIsLoading(false);
        };

        init();
    }, [checkSupport, getPermissionState, registerServiceWorker, fetchSubscriptions]);

    return {
        isSupported,
        permissionState,
        isSubscribed,
        subscription,
        subscriptions,
        isLoading,
        error,
        checkSupport,
        getPermissionState,
        requestPermission,
        subscribe,
        unsubscribe,
        saveSubscription,
        removeSubscription,
        fetchSubscriptions,
        enablePushNotifications,
        disablePushNotifications,
        clearError: () => setError(null),
    };
};

export default usePushNotifications;
