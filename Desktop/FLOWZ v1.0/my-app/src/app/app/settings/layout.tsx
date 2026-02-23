import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming button exists, mostly for styling nav if needed.
// Actually using a SideNav component would be better, but implementing simple layout here.

export const metadata: Metadata = {
    title: 'Paramètres',
    description: 'Gérez les paramètres de votre compte et de l\'application.',
};

interface SettingsLayoutProps {
    children: React.ReactNode;
}

const sidebarNavItems = [
    {
        title: "Profil",
        href: "/app/settings/profile",
    },
    {
        title: "Notifications",
        href: "/app/settings/notifications",
    },
    {
        title: "Apparence",
        href: "/app/settings/appearance",
    },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6 p-10 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
                <p className="text-muted-foreground">
                    Gérez les paramètres de votre compte et les préférences e-mail.
                </p>
            </div>
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        {sidebarNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="justify-start inline-flex items-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-4 py-2 hover:bg-transparent hover:underline"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    );
}
