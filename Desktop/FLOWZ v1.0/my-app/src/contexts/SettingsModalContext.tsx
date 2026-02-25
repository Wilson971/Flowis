import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SettingsTab =
    | "workspace-general"
    | "workspace-people"
    | "workspace-plans"
    | "store-general"
    | "store-sync"
    | "store-watermark"
    | "account-profile"
    | "account-notifications"
    | "account-security"
    | "account-preferences"
    | "account-ai"
    | "account-danger"
    | "integrations-general"
    | "integrations-gsc";

interface SettingsModalContextType {
    initialTab?: SettingsTab;
    setInitialTab: (tab: SettingsTab | undefined) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    openSettings: (tab?: SettingsTab) => void;
    closeSettings: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | undefined>(undefined);

export function SettingsModalProvider({ children }: { children: ReactNode }) {
    const [initialTab, setInitialTab] = useState<SettingsTab | undefined>(undefined);
    const [isOpen, setIsOpen] = useState(false);

    const openSettings = (tab?: SettingsTab) => {
        if (tab) setInitialTab(tab);
        setIsOpen(true);
    };

    const closeSettings = () => {
        setIsOpen(false);
    };

    return (
        <SettingsModalContext.Provider value={{
            initialTab,
            setInitialTab,
            isOpen,
            setIsOpen,
            openSettings,
            closeSettings
        }}>
            {children}
        </SettingsModalContext.Provider>
    );
}

export function useSettingsModal() {
    const context = useContext(SettingsModalContext);
    if (context === undefined) {
        throw new Error('useSettingsModal must be used within a SettingsModalProvider');
    }
    return context;
}
